/**
 * PDF to Image Converter using PDFRest API
 * Converts PDF pages to base64 images for LLM vision analysis
 */

const PDFREST_API_URL = 'https://api.pdfrest.com/jpg';
const PDFREST_API_KEY = process.env.PDFREST_API_KEY || '0ba276c0-e566-4770-9303-940872d3065d';

export interface PDFToImageOptions {
  maxPages?: number; // Maximum number of pages to convert (default: 5)
}

/**
 * Convert PDF buffer to array of base64 encoded images using PDFRest API
 * @param pdfBuffer - PDF file as Buffer
 * @param options - Conversion options
 * @returns Array of base64 encoded images (without data URI prefix)
 */
export async function convertPDFToImages(
  pdfBuffer: Buffer,
  options: PDFToImageOptions = {}
): Promise<string[]> {
  const { maxPages = 10 } = options;
  const images: string[] = [];

  try {
    console.log(`📄 Converting PDF to images using PDFRest API...`);

    // Create form data
    const formData = new FormData();
    // Convert Buffer to Uint8Array for Blob compatibility
    const uint8Array = new Uint8Array(pdfBuffer);
    const blob = new Blob([uint8Array], { type: 'application/pdf' });
    formData.append('file', blob, 'report.pdf');
    
    // Optional: Set output quality and other parameters
    formData.append('output', 'zip'); // Get all pages in a zip

    // Call PDFRest API with increased timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 60000); // 60 second timeout
    
    const response = await fetch(PDFREST_API_URL, {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Api-Key': PDFREST_API_KEY,
      },
      body: formData,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`PDFRest API error: ${response.status} - ${errorText}`);
    }

    const result = await response.json();
    
    // The API returns URLs to the converted images
    // Check if outputUrl is an array or a single URL
    if (result.outputUrl) {
      const urls = Array.isArray(result.outputUrl) 
        ? result.outputUrl 
        : result.outputUrl.split(',');
      
      console.log(`✓ PDF converted to ${urls.length} image(s), downloading...`);
      
      // Download each image and convert to base64
      let pageCount = 0;
      for (const url of urls) {
        if (pageCount >= maxPages) break;
        
        try {
          const imageUrl = url.trim();
          const imageResponse = await fetch(imageUrl);
          
          if (imageResponse.ok) {
            const imageBuffer = Buffer.from(await imageResponse.arrayBuffer());
            const base64Image = imageBuffer.toString('base64');
            images.push(base64Image);
            pageCount++;
            console.log(`✓ Downloaded page ${pageCount}`);
          }
        } catch (imgError) {
          console.error('Error downloading image:', imgError);
        }
      }
    }

    console.log(`📄 Extracted ${images.length} page(s) from PDF`);
    return images;
  } catch (error) {
    console.error('PDF to image conversion error:', error);
    // Return empty array instead of throwing to allow text-only analysis
    return [];
  }
}
