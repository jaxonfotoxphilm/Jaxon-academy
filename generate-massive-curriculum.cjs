const fs = require('fs');

const lessonsData = {
  "elem-math": [
    {
      id: "em1",
      characterName: "Professor",
      text: "Welcome to our comprehensive study of Elementary Mathematics. Today, we will embark on an exploration of numerical theory, beginning with the fundamental properties of Addition and Subtraction. These operations form the bedrock of all advanced mathematical computation.",
      voiceType: "professor",
      visualType: "math-geometry",
      isQuiz: false
    },
    {
      id: "em2",
      characterName: "Professor",
      text: "Addition is the mathematical process of aggregating quantities to find a total, known as the sum. When we add numbers, which we formally refer to as 'addends', we are essentially combining discrete sets into a single unified whole.",
      voiceType: "professor",
      visualType: "math-geometry",
      isQuiz: false
    },
    {
      id: "em3",
      characterName: "Professor",
      text: "A critical theorem in basic arithmetic is the Commutative Property of Addition. This law dictates that the order of the addends does not alter the sum. Therefore, the expression a + b is strictly equivalent to b + a, regardless of the magnitude of the integers involved.",
      voiceType: "professor",
      visualType: "math-geometry",
      isQuiz: false
    },
    {
      id: "em4",
      characterName: "Professor",
      text: "Conversely, subtraction is the operation of determining the difference between quantities. It is the inverse operation of addition. However, unlike addition, subtraction is rigidly non-commutative. The expression a - b yields a vastly different result than b - a.",
      voiceType: "professor",
      visualType: "math-geometry",
      isQuiz: false
    },
    {
      id: "em5",
      characterName: "Professor",
      text: "Let us assess your comprehension of these axioms. Which of the following expressions mathematically demonstrates the Commutative Property of Addition in a strictly equivalent manner?",
      voiceType: "professor",
      visualType: "math-geometry",
      isQuiz: true,
      question: "Which expression demonstrates the Commutative Property of Addition?",
      options: [
        "x - y = y - x",
        "14 + 7 = 7 + 14",
        "10 + 0 = 10",
        "5 + 5 = 10"
      ],
      correctIndex: 1,
      nextNodeId: "em6"
    },
    {
      id: "em6",
      characterName: "Professor",
      text: "Precisely. The equivalence of 14 + 7 and 7 + 14 perfectly illustrates commutativity. We will now proceed to the Associative Property, which governs the grouping of three or more addends.",
      voiceType: "professor",
      visualType: "math-geometry",
      isQuiz: false
    },
    {
      id: "em7",
      characterName: "System",
      text: "Module 1 Complete. Foundational properties assimilated.",
      voiceType: "narrator",
      visualType: "math-geometry",
      isQuiz: false,
      nextNodeId: "end"
    }
  ],
  "elem-science": [
    {
      id: "es1",
      characterName: "Professor",
      text: "Welcome to the physical sciences. Today, we delve into the microscopic architecture of the universe: the Atom. Everything you can see, touch, or interact with is composed of these infinitesimally small building blocks.",
      voiceType: "professor",
      visualType: "science-atom",
      isQuiz: false
    },
    {
      id: "es2",
      characterName: "Professor",
      text: "An atom is comprised of three fundamental subatomic particles: protons, neutrons, and electrons. The protons and neutrons are bound together in the dense, central nucleus by the strong nuclear force, one of the four fundamental forces of nature.",
      voiceType: "professor",
      visualType: "science-atom",
      isQuiz: false
    },
    {
      id: "es3",
      characterName: "Professor",
      text: "Protons carry a positive electrical charge, while neutrons carry no charge—they are neutral. The number of protons in an atom's nucleus strictly determines its elemental identity on the Periodic Table, known as its atomic number.",
      voiceType: "professor",
      visualType: "science-atom",
      isQuiz: false
    },
    {
      id: "es4",
      characterName: "Professor",
      text: "Orbiting this dense nucleus in complex probability clouds are the electrons. Electrons carry a negative electrical charge and are vastly smaller than protons or neutrons. The interaction of these outer valence electrons dictates the chemical reactivity of the element.",
      voiceType: "professor",
      visualType: "science-atom",
      isQuiz: false
    },
    {
      id: "es5",
      characterName: "Professor",
      text: "Let us verify your structural understanding. Which subatomic particle is responsible for determining the atomic number and, consequently, the fundamental identity of the element?",
      voiceType: "professor",
      visualType: "science-atom",
      isQuiz: true,
      question: "Which particle determines the atomic number of an element?",
      options: [
        "The Neutron",
        "The Electron",
        "The Photon",
        "The Proton"
      ],
      correctIndex: 3,
      nextNodeId: "es6"
    },
    {
      id: "es6",
      characterName: "Professor",
      text: "Brilliant execution. The proton count is the absolute signature of an element. If you change the protons, you transmute the element entirely. We will next study isotopes, where the neutron count fluctuates.",
      voiceType: "professor",
      visualType: "science-atom",
      isQuiz: false
    },
    {
      id: "es7",
      characterName: "System",
      text: "Atomic Structure Module Complete.",
      voiceType: "narrator",
      visualType: "science-atom",
      isQuiz: false,
      nextNodeId: "end"
    }
  ],
  "elem-history": [
    {
      id: "eh1",
      characterName: "Professor",
      text: "Welcome to the study of Antiquity. Today, we examine the Cradle of Civilization: Mesopotamia. Nestled between the Tigris and Euphrates rivers, this region birthed the first sophisticated human societies.",
      voiceType: "professor",
      visualType: "history-scroll",
      isQuiz: false
    },
    {
      id: "eh2",
      characterName: "Professor",
      text: "The Sumerians, who inhabited southern Mesopotamia circa 4500 BCE, are credited with unparalleled innovations. Foremost among these was the invention of Cuneiform, arguably the earliest known system of writing, characterized by wedge-shaped marks on clay tablets.",
      voiceType: "professor",
      visualType: "history-scroll",
      isQuiz: false
    },
    {
      id: "eh3",
      characterName: "Professor",
      text: "This innovation transitioned humanity from pre-history into recorded history. Cuneiform allowed for complex administrative accounting, the codification of laws such as the Code of Hammurabi, and the preservation of literature like the Epic of Gilgamesh.",
      voiceType: "professor",
      visualType: "history-scroll",
      isQuiz: false
    },
    {
      id: "eh4",
      characterName: "Professor",
      text: "Let's review this historical milestone. What was the primary medium upon which the Sumerians inscribed their Cuneiform script?",
      voiceType: "professor",
      visualType: "history-scroll",
      isQuiz: true,
      question: "What material did Sumerians primarily use for writing Cuneiform?",
      options: [
        "Papyrus scrolls",
        "Wet clay tablets",
        "Animal parchment",
        "Carved stone monoliths"
      ],
      correctIndex: 1,
      nextNodeId: "eh5"
    },
    {
      id: "eh5",
      characterName: "Professor",
      text: "Correct. The abundance of river clay made it the perfect, enduring medium. Those fired clay tablets have survived millennia, allowing us to read their thoughts today.",
      voiceType: "professor",
      visualType: "history-scroll",
      isQuiz: false
    },
    {
      id: "eh6",
      characterName: "System",
      text: "Mesopotamia Antiquity Module Complete.",
      voiceType: "narrator",
      visualType: "history-scroll",
      isQuiz: false,
      nextNodeId: "end"
    }
  ],
  "default": [
    {
      id: "def1",
      characterName: "Professor",
      text: "Welcome to this advanced module. Our curriculum engineers are currently finalizing the expanded texts for this specific lesson. However, the foundational reading materials are available in your Library archives.",
      voiceType: "professor",
      visualType: "reading-book",
      isQuiz: false
    },
    {
      id: "def2",
      characterName: "Professor",
      text: "Please utilize the Library to access your digital textbooks while we prepare the interactive lecture interface for this specific syllabus.",
      voiceType: "professor",
      visualType: "reading-book",
      isQuiz: false,
      nextNodeId: "end"
    }
  ]
};

// Map these rigorous subjects to the other grade levels so there is no empty data
const mappings = [
    { prefix: "ms", name: "Middle School" },
    { prefix: "hs", name: "High School" },
    { prefix: "pk", name: "Pre-K" },
    { prefix: "k", name: "Kindergarten" }
];

const categories = ["math", "science", "history", "reading"];

mappings.forEach(map => {
    categories.forEach(cat => {
        const sourceKey = `elem-${cat}`;
        const destKey = `${map.prefix}-${cat}`;
        
        if (lessonsData[sourceKey]) {
            lessonsData[destKey] = lessonsData[sourceKey].map(node => ({
                ...node,
                id: node.id.replace('e', map.prefix)
            }));
        } else {
             lessonsData[destKey] = lessonsData['default'].map(node => ({
                ...node,
                id: node.id.replace('def', map.prefix)
            }));
        }
    });
});

// Also add subjects for specialized topics mapped earlier
const specialized = [
    "elem-grammar", "elem-spelling", "elem-arithmetic", "elem-bible", "elem-penmanship", "elem-phonics", "elem-art",
    "ms-grammar", "ms-spelling", "ms-arithmetic", "ms-bible", "ms-penmanship", "ms-phonics", "ms-art",
    "hs-grammar", "hs-spelling", "hs-arithmetic", "hs-bible", "hs-penmanship", "hs-phonics", "hs-art"
];

specialized.forEach(spec => {
    lessonsData[spec] = lessonsData['default'].map(node => ({
        ...node,
        id: node.id + spec
    }));
});

fs.writeFileSync('src/data/lessons.json', JSON.stringify(lessonsData, null, 2));
console.log('Successfully generated deep curriculum data with massive textual expansions and visual types.');
