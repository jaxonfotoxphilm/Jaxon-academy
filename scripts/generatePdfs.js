import fs from 'fs';
import path from 'path';
import PDFDocument from 'pdfkit';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const lessonsPath = path.join(__dirname, '../src/data/lessons.json');
const outputDir = path.join(__dirname, '../public/curriculum-pdfs');

const lessonsData = JSON.parse(fs.readFileSync(lessonsPath, 'utf8'));

// Format the ID to a readable Title (e.g., "elem-math" -> "Elementary Math Curriculum")
const formatTitle = (id) => {
    if (id === 'default') return 'Academic Reference Material';
    
    let formatted = id.replace('elem-', 'Elementary ')
                      .replace('ms-', 'Middle School ')
                      .replace('hs-', 'High School ');
                      
    return formatted.split('-').join(' ').split(' ').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ') + ' Curriculum';
};

const getSubjectColor = (id) => {
    if (id.includes('math') || id.includes('arithmetic')) return '#1e3a8a'; // Deep Blue
    if (id.includes('science')) return '#064e3b'; // Emerald Green
    if (id.includes('history')) return '#78350f'; // Rich Brown/Gold
    if (id.includes('reading') || id.includes('phonics')) return '#4c1d95'; // Royal Purple
    if (id.includes('grammar') || id.includes('spelling')) return '#831843'; // Deep Pink/Red
    if (id.includes('bible')) return '#b45309'; // Bronze
    return '#1f2937'; // Default Dark Gray
};

console.log('Starting PREMIUM PDF generation from lessons.json...');

for (const [subjectId, nodes] of Object.entries(lessonsData)) {
    // Only process actual arrays of dialogue
    if (!Array.isArray(nodes)) continue;

    // Filter to get only the Professor's teaching text (ignore quizzes, branches, narrator)
    const contentNodes = nodes.filter(node => 
        (node.characterName === 'Professor' || node.characterName === 'Professor Grace') && 
        !node.isQuiz && 
        !node.isBranch &&
        node.text
    );

    if (contentNodes.length === 0) continue;

    const themeColor = getSubjectColor(subjectId);
    
    // Enable page buffering so we can add page numbers later
    const doc = new PDFDocument({ margin: 50, size: 'A4', bufferPages: true });
    // Strict web-safe URL formatting
    const safeId = subjectId.toLowerCase().replace(/[^a-z0-9]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    const outputPath = path.join(outputDir, `${safeId}.pdf`);
    
    doc.pipe(fs.createWriteStream(outputPath));

    // --- TITLE PAGE ---
    // Soft off-white background
    doc.rect(0, 0, doc.page.width, doc.page.height).fill('#f8fafc');
    
    // Elegant Double Border
    doc.rect(20, 20, doc.page.width - 40, doc.page.height - 40).strokeColor(themeColor).lineWidth(4).stroke();
    doc.rect(26, 26, doc.page.width - 52, doc.page.height - 52).strokeColor(themeColor).lineWidth(1).stroke();

    doc.moveDown(6);
    
    // Academy Header
    doc.fillColor(themeColor)
       .fontSize(16)
       .font('Times-Bold')
       .text('ABEKA SCHOLAR ACADEMY', { align: 'center', characterSpacing: 4 });
       
    doc.moveDown(5);
    
    // Main Title
    doc.fillColor('#0f172a')
       .fontSize(42)
       .font('Times-Bold')
       .text(formatTitle(subjectId), { align: 'center' });

    doc.moveDown(3);
    
    // Subtitle
    doc.fillColor('#475569')
       .fontSize(18)
       .font('Times-Italic')
       .text('Official Curriculum & Study Material', { align: 'center' });

    doc.addPage();
    
    // --- CONTENT PAGES ---
    let chapterCount = 1;
    let paragraphCount = 0;
    let paragraphText = "";
    
    const renderChapterHeader = (num) => {
        doc.moveDown(1);
        doc.fillColor(themeColor)
           .fontSize(22)
           .font('Times-Bold')
           .text(`Chapter ${num}`, { underline: false });
        
        // A nice little divider line under the chapter
        doc.moveTo(doc.x, doc.y + 4)
           .lineTo(doc.x + 100, doc.y + 4)
           .strokeColor(themeColor)
           .lineWidth(2)
           .stroke();
           
        doc.moveDown(1.5);
    };

    renderChapterHeader(chapterCount);

    for (let i = 0; i < contentNodes.length; i++) {
        const node = contentNodes[i];
        paragraphText += node.text + " ";
        
        // Group a few dialogue nodes into a single coherent paragraph
        if (i % 3 === 2 || i === contentNodes.length - 1) {
            doc.fillColor('#1e293b')
               .fontSize(12)
               .font('Times-Roman')
               .text(paragraphText.trim(), {
                   align: 'justify',
                   lineGap: 8, // Relaxed line spacing for readability
                   paragraphGap: 16
               });
               
            paragraphText = "";
            paragraphCount++;
            
            // Start a new chapter every 5 paragraphs
            if (paragraphCount % 5 === 0 && i < contentNodes.length - 1) {
                chapterCount++;
                // Add page break if we are near the bottom
                if (doc.y > doc.page.height - 150) {
                    doc.addPage();
                }
                renderChapterHeader(chapterCount);
            }
        }
    }

    // Add Page Numbers to all pages except the title page
    const range = doc.bufferedPageRange();
    for (let i = 0; i < range.count; i++) {
        doc.switchToPage(i);
        
        if (i > 0) { // skip title page
            // Top Header Line
            doc.moveTo(50, 40)
               .lineTo(doc.page.width - 50, 40)
               .strokeColor('#e2e8f0')
               .lineWidth(1)
               .stroke();
               
            doc.fillColor('#94a3b8')
               .fontSize(10)
               .font('Helvetica-Oblique')
               .text(formatTitle(subjectId), 50, 25, { align: 'right' });
               
            // Bottom Page Number
            doc.fillColor('#64748b')
               .fontSize(11)
               .font('Helvetica-Bold')
               .text(`- ${i} -`, 50, doc.page.height - 40, { align: 'center' });
        }
    }
    
    // Flush the buffered pages and close the stream
    doc.flushPages();
    doc.end();
    
    console.log(`Generated Premium PDF: ${outputPath}`);
}

console.log('All Premium PDFs generated successfully!');
