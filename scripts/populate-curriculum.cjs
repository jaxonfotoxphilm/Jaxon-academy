/**
 * populate-curriculum.cjs
 * 
 * Reads the scraped Core Knowledge materials and generates a clean,
 * properly-ordered curriculum-structure.json for the Jaxon Academy app.
 * 
 * Fixes applied over the original Gemini version:
 *  1. Sorts units in ascending order (Unit 1 → Unit 9) per Core Knowledge sequencing
 *  2. Decodes HTML entities in titles
 *  3. Filters out non-instructional items (ancillary, ELL, activity books, state-specific)
 *  4. Produces clean student-facing display titles
 */
const fs = require('fs');

// ─── HTML Entity Decoder ────────────────────────────────────────────────
function decodeHtmlEntities(str) {
    return str
        .replace(/&#8217;/g, '\u2019')  // right single quote '
        .replace(/&#8216;/g, '\u2018')  // left single quote '
        .replace(/&#8211;/g, '\u2013')  // en-dash –
        .replace(/&#8212;/g, '\u2014')  // em-dash —
        .replace(/&#038;/g, '&')
        .replace(/&amp;/g, '&')
        .replace(/&#8220;/g, '\u201C')  // left double quote "
        .replace(/&#8221;/g, '\u201D')  // right double quote "
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"');
}

// ─── Filter: skip non-student-facing resources ──────────────────────────
function isStudentFacingCurriculum(title) {
    const skipPatterns = [
        /Ancillary Materials/i,
        /Resources for English Language Learners/i,
        /Primary Source Activity Book/i,
        /Social Skills Posters/i,
        /Content and Skill Guidelines/i,         // The CK Sequence overview doc
        /Louisiana Bayou Bridges/i,              // State-specific
        /CK In Your State History/i,             // State-specific
        /Connecting Math to Our World/i,         // Supplemental reader, not a unit
        /Science in Action: Kyle and Jamie/i,    // Supplemental reader
    ];
    return !skipPatterns.some(p => p.test(title));
}

// ─── Subject Classification ────────────────────────────────────────────
function classifySubject(title) {
    if (/^CKLA/i.test(title))   return { id: 'ela',  name: 'Language Arts',      icon: '📚' };
    if (/^CKMath/i.test(title)) return { id: 'math', name: 'Mathematics',        icon: '🔢' };
    if (/^CKSci/i.test(title))  return { id: 'sci',  name: 'Science',            icon: '🔬' };
    if (/^CKHG/i.test(title))   return { id: 'hg',   name: 'History & Geography', icon: '🌍' };
    if (/Music/i.test(title) || /Visual Arts/i.test(title))
                                return { id: 'arts', name: 'The Arts',           icon: '🎨' };
    // Fallback: inspect deeper
    if (/History/i.test(title) || /Civics/i.test(title))
                                return { id: 'hg',   name: 'History & Geography', icon: '🌍' };
    return { id: 'ela', name: 'Language Arts', icon: '📚' };
}

// ─── Extract unit/domain number for sorting ─────────────────────────────
function extractUnitNumber(title) {
    // Match patterns like "Unit 3:", "Domain 7:", "Domain 12:"
    const match = title.match(/(?:Unit|Domain)\s+(\d+)/i);
    return match ? parseInt(match[1], 10) : 999; // 999 = no number → sort to end
}

// ─── Main ───────────────────────────────────────────────────────────────
function run() {
    console.log('Reading core-knowledge-materials.json...');
    const rawData = fs.readFileSync('src/data/core-knowledge-materials.json', 'utf8');
    const materials = JSON.parse(rawData);

    const structure = {
        grades: [
            { id: 'grade-PK', label: 'Pre-K',        subjects: [] },
            { id: 'grade-K',  label: 'Kindergarten',  subjects: [] },
            { id: 'grade-1',  label: 'Grade 1',       subjects: [] },
            { id: 'grade-2',  label: 'Grade 2',       subjects: [] },
            { id: 'grade-3',  label: 'Grade 3',       subjects: [] },
            { id: 'grade-4',  label: 'Grade 4',       subjects: [] },
            { id: 'grade-5',  label: 'Grade 5',       subjects: [] },
            { id: 'grade-6',  label: 'Grade 6',       subjects: [] },
            { id: 'grade-7',  label: 'Grade 7',       subjects: [] },
            { id: 'grade-8',  label: 'Grade 8',       subjects: [] },
        ]
    };

    const gradeMap = {
        'Preschool':    'grade-PK',
        'Pre-K':        'grade-PK',
        'Kindergarten': 'grade-K',
        'Grade 6':      'grade-6',
        'Grade 7':      'grade-7',
        'Grade 8':      'grade-8',
    };

    let skipped = 0;
    let inserted = 0;

    materials.forEach(item => {
        const gradeId = gradeMap[item.grade];
        if (!gradeId) return;

        const cleanTitle = decodeHtmlEntities(item.title);

        // Filter out non-student-facing resources
        if (!isStudentFacingCurriculum(cleanTitle)) {
            skipped++;
            console.log(`  [SKIP] ${cleanTitle}`);
            return;
        }

        const gradeNode = structure.grades.find(g => g.id === gradeId);
        if (!gradeNode) return;

        const subjMeta = classifySubject(cleanTitle);
        const subjId = `subj-${gradeId}-${subjMeta.id}`;

        let subjNode = gradeNode.subjects.find(s => s.id === subjId);
        if (!subjNode) {
            subjNode = { id: subjId, name: subjMeta.name, icon: subjMeta.icon, lessons: [] };
            gradeNode.subjects.push(subjNode);
        }

        // Temporarily push with a sortKey; we'll assign day numbers after sorting
        subjNode.lessons.push({
            _sortKey: extractUnitNumber(cleanTitle),
            title: cleanTitle,
            dynamicQuery: `dynamic:${cleanTitle}`,
            teacherGuideUrl: item.url,
        });

        inserted++;
    });

    // ─── Sort & Assign Sequential IDs ───────────────────────────────────
    // Ensures Unit 1 is Day 1, Unit 2 is Day 2, etc.
    structure.grades.forEach(grade => {
        grade.subjects.forEach(subj => {
            subj.lessons.sort((a, b) => a._sortKey - b._sortKey);
            subj.lessons = subj.lessons.map((lesson, idx) => ({
                id: `l${idx + 1}`,
                day: idx + 1,
                title: lesson.title,
                dynamicQuery: lesson.dynamicQuery,
                teacherGuideUrl: lesson.teacherGuideUrl,
            }));
        });

        // Enforce a consistent subject order: ELA → Math → Science → H&G → Arts
        const subjectOrder = ['ela', 'math', 'sci', 'hg', 'arts'];
        grade.subjects.sort((a, b) => {
            const aKey = a.id.split('-').pop();
            const bKey = b.id.split('-').pop();
            return (subjectOrder.indexOf(aKey) ?? 99) - (subjectOrder.indexOf(bKey) ?? 99);
        });
    });

    // Placeholder for empty grades so the UI doesn't crash
    structure.grades.forEach(grade => {
        if (grade.subjects.length === 0) {
            grade.subjects.push({
                id: `placeholder-${grade.id}`,
                name: 'Curriculum Pending',
                icon: '📁',
                lessons: [],
            });
        }
    });

    fs.writeFileSync('src/data/curriculum-structure.json', JSON.stringify(structure, null, 2));
    console.log(`\n✅ Done! Inserted ${inserted} lesson units, skipped ${skipped} non-instructional items.`);

    // Quick verification: print first unit per subject per active grade
    console.log('\n── Verification: First unit per subject ──');
    ['grade-PK', 'grade-K', 'grade-6', 'grade-7', 'grade-8'].forEach(gid => {
        const g = structure.grades.find(x => x.id === gid);
        console.log(`\n${g.label}:`);
        g.subjects.forEach(s => {
            if (s.lessons.length > 0) {
                console.log(`  ${s.icon} ${s.name}: "${s.lessons[0].title}" → "${s.lessons[s.lessons.length - 1].title}" (${s.lessons.length} units)`);
            }
        });
    });
}

run();
