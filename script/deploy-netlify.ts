import { build as esbuild } from "esbuild";
import { build as viteBuild } from "vite";
import { rm, readFile, writeFile, mkdir } from "fs/promises";
import { join } from "path";

async function prepareForNetlify() {
  console.log("🚀 Preparing for Netlify deployment...");
  
  // Clean and build
  await rm("dist", { recursive: true, force: true });
  
  console.log("📦 Building client...");
  await viteBuild();
  
  // Copy client build to dist
  console.log("📁 Setting up static files...");
  
  // Create netlify functions directory
  await mkdir("netlify/functions", { recursive: true });
  
  // Create a simple API proxy function
  await writeFile("netlify/functions/api.js", `
export async function handler(event, context) {
  const { httpMethod, path, body } = event;
  
  // For now, return a simple response
  // In production, you'd convert your Express routes here
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*'
    },
    body: JSON.stringify({
      message: "API endpoint - convert your Express routes to Netlify Functions",
      method: httpMethod,
      path: path
    })
  };
}
  `);
  
  // Create _redirects file for SPA routing
  await writeFile("dist/_redirects", `
/*    /index.html   200
/api/*  /.netlify/functions/api  200
  `);
  
  // Create netlify.toml if it doesn't exist
  await writeFile("netlify.toml", `
[build]
  publish = "dist"
  command = "npm run build"

[build.environment]
  NODE_VERSION = "18"

[[redirects]]
  from = "/api/*"
  to = "/.netlify/functions/:splat"
  status = 200

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200

[functions]
  directory = "netlify/functions"
  node_bundler = "esbuild"
  `);
  
  console.log("✅ Netlify deployment ready!");
  console.log("📝 Next steps:");
  console.log("1. Push to GitHub");
  console.log("2. Connect to Netlify");
  console.log("3. Set environment variables");
  console.log("4. Deploy!");
}

prepareForNetlify().catch((err) => {
  console.error(err);
  process.exit(1);
});
