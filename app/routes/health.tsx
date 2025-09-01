// Vercel health check endpoint
import type { LoaderFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import prisma from "../db.server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  try {
    // Test database connection
    await prisma.$connect();
    
    // Test environment variables
    const requiredEnvVars = [
      'SHOPIFY_API_KEY',
      'SHOPIFY_API_SECRET',
      'DATABASE_URL',
      'SESSION_SECRET'
    ];
    
    const missingEnvVars = requiredEnvVars.filter(envVar => !process.env[envVar]);
    
    if (missingEnvVars.length > 0) {
      throw new Error(`Missing environment variables: ${missingEnvVars.join(', ')}`);
    }
    
    return json({ 
      status: "healthy",
      timestamp: new Date().toISOString(),
      database: "connected",
      environment: "configured"
    });
  } catch (error) {
    console.error("Health check failed:", error);
    return json({ 
      status: "error",
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : "Unknown error"
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
};
