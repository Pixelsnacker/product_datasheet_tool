import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, protectedProcedure, router } from "./_core/trpc";
import { z } from "zod";
import * as db from "./db";
import { storagePut } from "./storage";
import { nanoid } from "nanoid";
import { generateProductPDF } from "./pdfGenerator";

// Schema definitions
const descriptionSectionSchema = z.object({
  title: z.string(),
  items: z.array(z.string()),
});

const technicalDataRowSchema = z.object({
  label: z.string(),
  values: z.array(z.string()),
});



export const appRouter = router({
  system: systemRouter,
  
  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  products: router({
    // List all products for the current user
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getProductsByUserId(ctx.user.id);
    }),

    // Get a single product by ID (public for permanent links)
    getById: publicProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getProductById(input.id);
      }),

    // Generate PDF for a product
    generatePdf: publicProcedure
      .input(z.object({ id: z.number(), userId: z.number().optional() }))
      .mutation(async ({ input }) => {
        const product = await db.getProductById(input.id);
        if (!product) {
          throw new Error("Product not found");
        }
        
        // Get user's PDF settings if userId is provided
        const userId = input.userId || product.userId;
        let pdfSettingsForPdf: Partial<import('./pdfGenerator').PdfSettingsData> | undefined;
        
        if (userId) {
          const dbSettings = await db.getPdfSettingsByUserId(userId);
          if (dbSettings) {
            // Convert null values to undefined for type compatibility
            pdfSettingsForPdf = {
              marginTop: dbSettings.marginTop ?? undefined,
              marginBottom: dbSettings.marginBottom ?? undefined,
              marginLeft: dbSettings.marginLeft ?? undefined,
              marginRight: dbSettings.marginRight ?? undefined,
              fontSizeTitle: dbSettings.fontSizeTitle ?? undefined,
              fontSizeSubtitle: dbSettings.fontSizeSubtitle ?? undefined,
              fontSizeHeading: dbSettings.fontSizeHeading ?? undefined,
              fontSizeText: dbSettings.fontSizeText ?? undefined,
              fontSizeTable: dbSettings.fontSizeTable ?? undefined,
              fontSizeFooter: dbSettings.fontSizeFooter ?? undefined,
              sectionSpacing: dbSettings.sectionSpacing ?? undefined,
              lineHeight: dbSettings.lineHeight ?? undefined,
              maxImageHeight: dbSettings.maxImageHeight ?? undefined,
              logoHeight: dbSettings.logoHeight ?? undefined,
              tableRowPadding: dbSettings.tableRowPadding ?? undefined,
            };
          }
        }
        
        const pdfBuffer = await generateProductPDF(product, pdfSettingsForPdf);
        const base64 = pdfBuffer.toString('base64');
        
        return {
          pdf: base64,
          filename: `${product.productName.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`,
        };
      }),

    // Create a new product
    create: protectedProcedure
      .input(z.object({
        productName: z.string().min(1),
        productSubtitle: z.string().optional(),
        imageUrl: z.string().optional(),
        imageScale: z.number().min(10).max(200).optional(),
        descriptionSections: z.array(descriptionSectionSchema).optional(),
        technicalDataColumns: z.array(z.string()).optional(),
        columnWidths: z.array(z.number()).optional(),
        technicalDataRows: z.array(technicalDataRowSchema).optional(),
        documentNumber: z.string().optional(),
        category: z.string().optional(),
        sortOrder: z.number().optional(),
        language: z.enum(["de", "en", "pl", "es"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createProduct({
          ...input,
          userId: ctx.user.id,
        });
      }),

    // Update a product
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        productName: z.string().min(1).optional(),
        productSubtitle: z.string().optional(),
        imageUrl: z.string().optional(),
        imageScale: z.number().min(10).max(200).optional(),
        descriptionSections: z.array(descriptionSectionSchema).optional(),
        technicalDataColumns: z.array(z.string()).optional(),
        columnWidths: z.array(z.number()).optional(),
        technicalDataRows: z.array(technicalDataRowSchema).optional(),
        documentNumber: z.string().optional(),
        category: z.string().optional(),
        sortOrder: z.number().optional(),
        language: z.enum(["de", "en", "pl", "es"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product || product.userId !== ctx.user.id) {
          throw new Error("Product not found or unauthorized");
        }
        
        const { id, ...data } = input;
        await db.updateProduct(id, data);
        return { success: true };
      }),

    // Delete a product
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product || product.userId !== ctx.user.id) {
          throw new Error("Product not found or unauthorized");
        }
        
        await db.deleteProduct(input.id);
        return { success: true };
      }),

    // Update category and sort order of a product (for drag & drop)
    updateCategory: protectedProcedure
      .input(z.object({
        id: z.number(),
        category: z.string().nullable(),
        sortOrder: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product || product.userId !== ctx.user.id) {
          throw new Error("Product not found or unauthorized");
        }
        await db.updateProduct(input.id, {
          category: input.category ?? undefined,
          sortOrder: input.sortOrder ?? 0,
        });
        return { success: true };
      }),

    // Duplicate a product
    duplicate: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        const product = await db.getProductById(input.id);
        if (!product || product.userId !== ctx.user.id) {
          throw new Error("Product not found or unauthorized");
        }
        
        // Create a copy with modified name
        const newProduct = await db.createProduct({
          userId: ctx.user.id,
          productName: `${product.productName} (Kopie)`,
          productSubtitle: product.productSubtitle || undefined,
          imageUrl: product.imageUrl || undefined,
          imageScale: product.imageScale || undefined,
          descriptionSections: product.descriptionSections || undefined,
          technicalDataColumns: product.technicalDataColumns || undefined,
          technicalDataRows: product.technicalDataRows || undefined,
          documentNumber: product.documentNumber || undefined,
        });
        
        return newProduct;
      }),
  }),

  // Templates
  templates: router({
    // List all templates (system + user templates)
    list: protectedProcedure.query(async ({ ctx }) => {
      return db.getAllTemplates(ctx.user.id);
    }),

    // Get a single template by ID
    getById: protectedProcedure
      .input(z.object({ id: z.number() }))
      .query(async ({ input }) => {
        return db.getTemplateById(input.id);
      }),

    // Create a new user template
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        category: z.string().optional(),
        descriptionSections: z.array(descriptionSectionSchema).optional(),
        technicalDataColumns: z.array(z.string()).optional(),
        columnWidths: z.array(z.number()).optional(),
        technicalDataRows: z.array(technicalDataRowSchema).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        return db.createTemplate({
          ...input,
          userId: ctx.user.id,
          isSystemTemplate: false,
        });
      }),

    // Delete a user template
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await db.deleteTemplate(input.id, ctx.user.id);
        return { success: true };
      }),
  }),  // PDF Settings
  pdfSettings: router({
    // Get current user's PDF settings
    get: protectedProcedure.query(async ({ ctx }) => {
      const settings = await db.getPdfSettingsByUserId(ctx.user.id);
      // Return defaults if no settings exist
      return settings || {
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        fontSizeTitle: 18,
        fontSizeSubtitle: 14,
        fontSizeHeading: 9,
        fontSizeText: 8,
        fontSizeTable: 7,
        fontSizeFooter: 6,
        sectionSpacing: 8,
        lineHeight: 130,
        maxImageHeight: 180,
        logoHeight: 32,
        tableRowPadding: 4,
      };
    }),

    // Update PDF settings
    update: protectedProcedure
      .input(z.object({
        marginTop: z.number().min(0).max(50).optional(),
        marginBottom: z.number().min(0).max(50).optional(),
        marginLeft: z.number().min(0).max(50).optional(),
        marginRight: z.number().min(0).max(50).optional(),
        fontSizeTitle: z.number().min(8).max(36).optional(),
        fontSizeSubtitle: z.number().min(6).max(28).optional(),
        fontSizeHeading: z.number().min(5).max(20).optional(),
        fontSizeText: z.number().min(4).max(16).optional(),
        fontSizeTable: z.number().min(4).max(14).optional(),
        fontSizeFooter: z.number().min(4).max(12).optional(),
        sectionSpacing: z.number().min(0).max(30).optional(),
        lineHeight: z.number().min(100).max(200).optional(),
        maxImageHeight: z.number().min(50).max(400).optional(),
        logoHeight: z.number().min(16).max(80).optional(),
        tableRowPadding: z.number().min(1).max(12).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await db.upsertPdfSettings(ctx.user.id, input);
        return { success: true };
      }),

    // Reset to defaults
    reset: protectedProcedure.mutation(async ({ ctx }) => {
      await db.upsertPdfSettings(ctx.user.id, {
        marginTop: 10,
        marginBottom: 10,
        marginLeft: 10,
        marginRight: 10,
        fontSizeTitle: 18,
        fontSizeSubtitle: 14,
        fontSizeHeading: 9,
        fontSizeText: 8,
        fontSizeTable: 7,
        fontSizeFooter: 6,
        sectionSpacing: 8,
        lineHeight: 130,
        maxImageHeight: 180,
        logoHeight: 32,
        tableRowPadding: 4,
      });
      return { success: true };
    }),
  }),

  // File upload endpoint
  upload: router({
    image: protectedProcedure
      .input(z.object({
        fileName: z.string(),
        fileData: z.string(), // Base64 encoded
        contentType: z.string(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { fileName, fileData, contentType } = input;
        
        // Generate unique file key
        const ext = fileName.split('.').pop() || 'jpg';
        const fileKey = `products/${ctx.user.id}/${nanoid()}.${ext}`;
        
        // Decode base64 and upload
        const buffer = Buffer.from(fileData, 'base64');
        const { url } = await storagePut(fileKey, buffer, contentType);
        
        return { url };
      }),
  }),
});

export type AppRouter = typeof appRouter;
