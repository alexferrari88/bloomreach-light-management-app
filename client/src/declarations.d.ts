// client/src/declarations.d.ts

// For CSS files
declare module "*.css" {
  const classes: { [key: string]: string };
  export default classes;
}

// For image files
declare module "*.png";
declare module "*.jpg";
declare module "*.jpeg";
declare module "*.svg";
declare module "*.gif";

// For static file import
declare module "*.json" {
  const value: any;
  export default value;
}

declare module "file-saver";
