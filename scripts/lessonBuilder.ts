import * as fs from 'fs';
import * as path from 'path';


/**
 * Paths
 */
const DESKTOP_DIR = path.join(process.env.HOME || '', 'Desktop');
const CURRICULUM_SRC = path.join(DESKTOP_DIR, 'curriculum');
const PUBLIC_ASSETS = path.join(process.cwd(), 'public', 'assets', 'curriculum');
const LESSONS_JSON = path.join(process.cwd(), 'src', 'data', 'lessons.json');

/**
 * Placeholder thumbnail (generated earlier) – copy this for each lesson.
 */
const PLACEHOLDER_IMG = path.join(process.cwd(), '.gemini', 'antigravity', 'brain', '349794ea-77df-4208-8573-fbb5049a9585', 'curriculum_placeholder_1778646323831.png');

/**
 * Build lesson objects for each grade.
 */
interface Lesson {
  id: string;
  title: string;
  description: string;
  pdfUrl: string; // relative to /assets/curriculum/<grade>/filename.pdf
  thumbnailUrl: string;
  contentBlocks?: Array<{type: string; content?: string; src?: string}>;
  miniGames?: string[];
}

interface GradeBlock {
  grade: string;
  lessons: Lesson[];
}

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

function copyFile(src: string, dest: string) {
  fs.copyFileSync(src, dest);
}

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function build(): void {
  const grades = fs.readdirSync(CURRICULUM_SRC, { withFileTypes: true })
    .filter(d => d.isDirectory())
    .map(d => d.name);

  const allGrades: GradeBlock[] = [];

  for (const grade of grades) {
    const srcGradePath = path.join(CURRICULUM_SRC, grade);
    const destGradePath = path.join(PUBLIC_ASSETS, grade);
    ensureDir(destGradePath);

    // Ensure placeholder image exists in dest folder
    const placeholderDest = path.join(destGradePath, 'placeholder.png');
    if (fs.existsSync(PLACEHOLDER_IMG)) {
      copyFile(PLACEHOLDER_IMG, placeholderDest);
    }

    const files = fs.readdirSync(srcGradePath)
      .filter(f => f.toLowerCase().endsWith('.pdf'));

    const lessons: Lesson[] = [];

    if (files.length === 0) {
      // Add a placeholder lesson for empty grades
      lessons.push({
        id: `${slugify(grade)}-placeholder-1`,
        title: 'Content Coming Soon',
        description: `Curriculum material for ${grade} will be added later.`,
        pdfUrl: '',
        thumbnailUrl: `/assets/curriculum/${grade}/placeholder.png`,
        miniGames: [],
      });
    } else {
      for (const file of files) {
        const srcFile = path.join(srcGradePath, file);
        const destFile = path.join(destGradePath, file);
        copyFile(srcFile, destFile);
        const lessonId = `${slugify(grade)}-${slugify(path.parse(file).name)}`;
        const title = path.parse(file).name.replace(/[_-]/g, ' ');
        const lesson: Lesson = {
          id: lessonId,
          title,
          description: `Lesson for ${grade}: ${title}`,
          pdfUrl: `/assets/curriculum/${grade}/${file}`,
          thumbnailUrl: `/assets/curriculum/${grade}/placeholder.png`,
        };
        lessons.push(lesson);
      }
    }

    allGrades.push({ grade, lessons });
  }

  // Write JSON file (pretty printed)
  fs.writeFileSync(LESSONS_JSON, JSON.stringify(allGrades, null, 2), { encoding: 'utf-8' });
  console.log('✅ Curriculum JSON generated at', LESSONS_JSON);
}

import { fileURLToPath } from 'url';

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  build();
}
