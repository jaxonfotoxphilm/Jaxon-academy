const fs = require('fs');

async function scrapeApi() {
    console.log("Fetching data from Core Knowledge REST API...");
    const results = [];
    const targetClasses = {
        'grade-preschool': 'Preschool',
        'grade-pre-k': 'Pre-K',
        'grade-kindergarten': 'Kindergarten',
        'grade-grade6': 'Grade 6',
        'grade-grade7': 'Grade 7',
        'grade-grade8': 'Grade 8'
    };

    try {
        // Typically around 500-800 items. We will fetch 15 pages of 100 items just to be safe.
        for (let page = 1; page <= 15; page++) {
            console.log(`Fetching page ${page}...`);
            const url = `https://www.coreknowledge.org/wp-json/wp/v2/library?per_page=100&page=${page}`;
            const res = await fetch(url);
            
            if (!res.ok) {
                if (res.status === 400 || res.status === 404) {
                    console.log("Reached end of paginated API.");
                    break;
                }
                throw new Error(`API error: ${res.status}`);
            }

            const data = await res.json();
            if (data.length === 0) {
                console.log("No more items.");
                break;
            }

            for (const item of data) {
                const classList = item.class_list || [];
                let matchedGrade = null;
                
                // Check if any class starts with one of our targets
                for (const cls of classList) {
                    for (const [key, label] of Object.entries(targetClasses)) {
                        if (cls.startsWith(key)) {
                            matchedGrade = label;
                            break;
                        }
                    }
                    if (matchedGrade) break;
                }
                
                if (matchedGrade) {
                    results.push({
                        grade: matchedGrade,
                        title: item.title?.rendered ? item.title.rendered.replace(/&#038;/g, '&').replace(/&#8211;/g, '-').replace(/<[^>]+>/g, '') : '',
                        url: item.link
                    });
                }
            }
        }
    } catch (e) {
        console.error("Error scraping API:", e);
    }
    
    // Sort results logically
    results.sort((a, b) => {
        const order = { 'Preschool': 1, 'Pre-K': 1, 'Kindergarten': 2, 'Grade 6': 3, 'Grade 7': 4, 'Grade 8': 5 };
        return (order[a.grade] || 99) - (order[b.grade] || 99);
    });

    fs.writeFileSync('src/data/core-knowledge-materials.json', JSON.stringify(results, null, 2));
    console.log(`\nSuccessfully scraped and saved ${results.length} targeted resources!`);
}

scrapeApi();
