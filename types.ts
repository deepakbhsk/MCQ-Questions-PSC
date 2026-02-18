
export const ADMIN_EMAIL = 'deepakbhaskarank01@gmail.com';

export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}

export enum QuestionLevel {
  SEVENTH = '7th',
  TENTH = '10th',
  TWELFTH = '12th',
  DEGREE = 'Degree',
  TECHNICAL = 'Technical',
  OTHERS = 'Others',
  TOPIC = 'Topic',
}

export type QuizMode = 'practice' | 'exam';

export const SUBTOPIC_SUGGESTIONS = [
  'History',
  'Geography',
  'Economics',
  'Civics',
  'Indian Constitution',
  'Arts, Literature, Culture, Sports',
  'Basics of Computer',
  'Science and Technology',
  'Simple Arithmetic, Mental Ability, and Reasoning',
  'General English',
  'Regional Language (Malayalam)',
  'Current Affairs',
];

export const HISTORY_SYLLABUS = [
    // Kerala
    'Arrival of Europeans (Kerala)',
    'Contributions of Europeans (Kerala)',
    'History of Travancore (Marthanda Varma to Sree Chithirathirunnal)',
    'Social and Religious Reform Movement (Kerala)',
    'National Movement in Kerala',
    'Literary Sources of Kerala History',
    'United Kerala Movement',
    'Political and Social History of Kerala after 1956',
    
    // India
    'Medieval India Political History',
    'Administrative Reforms (India)',
    'Contributions (Medieval India)',
    'Establishment of the British',
    'First War of Independence',
    'Formation of INC',
    'Swadeshi Movement',
    'Social Reform Movement (India)',
    'Newspapers, Literature and Art (Freedom Struggle)',
    'Independent Movement & Mahatma Gandhi',
    'Extremist Movement in India',
    'India\'s Independence',
    'Post Independent Period (India)',
    'State Reorganization',
    'Development in Science, Education, and Technology',
    'Foreign Policy (India)',
    'Political History after 1951',

    // World
    'Great Revolution in England',
    'American War of Independence',
    'French Revolution',
    'Russian Revolution',
    'Chinese Revolution',
    'Political History after Second World War',
    'UNO and other International Organizations'
];

export const GEOGRAPHY_SYLLABUS = [
    // Basics of Geography
    'Basics of Geography',
    'Earth Structure',
    'Atmosphere',
    'Rocks',
    'Landforms',
    'Pressure Belt and Winds',
    'Temperature and Seasons',
    'Global Issues',
    'Global Warming',
    'Various forms of Pollutions',
    'Maps',
    'Topographic Maps and Signs',
    'Remote Sensing',
    'Geographic Information System (GIS)',
    'Oceans and its various movements',
    'Continents',
    'World Nations and its specific features',

    // India
    'Physiography (India)',
    'States and Its features',
    'Northern Mountain Region',
    'Rivers (India)',
    'Northern Great Plain',
    'Peninsular Plateau',
    'Coastal Plain',
    'Climate (India)',
    'Natural Vegetation (India)',
    'Agriculture (India)',
    'Minerals and Industries (India)',
    'Energy Sources (India)',
    'Transport System (India) - Road',
    'Transport System (India) - Water',
    'Transport System (India) - Railway',
    'Transport System (India) - Air',

    // Kerala
    'Physiography (Kerala)',
    'Districts and Its features',
    'Rivers (Kerala)',
    'Climate (Kerala)',
    'Natural Vegetation (Kerala)',
    'Wild Life (Kerala)',
    'Agriculture and Research Centers (Kerala)',
    'Minerals and Industries (Kerala)',
    'Energy Sources (Kerala)',
    'Transport System (Kerala) - Road',
    'Transport System (Kerala) - Water',
    'Transport System (Kerala) - Railway',
    'Transport System (Kerala) - Air'
];

export const ECONOMICS_SYLLABUS = [
    'National Income',
    'Per Capita Income',
    'Factors of Production',
    'Economic Sectors of Production',
    'Indian Economic Planning',
    'Five Year Plans',
    'NITI Aayog',
    'Types and Functions of Economic Institutions',
    'Reserve Bank & Functions',
    'Public Revenue',
    'Tax and Non Tax Revenue',
    'Public Expenditure',
    'Budget',
    'Fiscal Policy',
    'Consumer Protection & Rights'
];

export const CIVICS_SYLLABUS = [
    'Public Administration',
    'Bureaucracy – Features and Function',
    'Indian Civil Service',
    'State Civil Service',
    'E-Governance',
    'Information Commission and Right to Information Act',
    'Lokpal & Lokayukta',
    'Government – Executive, Judiciary, Legislature',
    'Election – Political Parties',
    'Human Rights – Human Rights Organizations',
    'Acts and Rules regarding Consumer Protection',
    'Watershed Management',
    'Labour and Employment',
    'National Rural Employment Policies',
    'Land Reforms',
    'Protection of Women, Children, and Old Age People',
    'Social Welfare',
    'Social Security',
    'Socio-Economic Statistical Data'
];

export const INDIAN_CONSTITUTION_SYLLABUS = [
    'Constituent Assembly',
    'Preamble',
    'Fundamental Rights',
    'Directive Principles',
    'Fundamental Duties',
    'Citizenship',
    'Constitutional Amendments',
    'Panchayath Raj',
    'Constitutional Institutions and their Functions',
    'Emergency',
    'Union List',
    'State List',
    'Concurrent List'
];

export const COMPUTER_SCIENCE_SYLLABUS = [
    // Hardware
    'Input Devices',
    'Output Devices',
    'Memory Devices (Primary and Secondary)',
    
    // Software
    'System Software and Application Software',
    'Operating System – Functions and Examples',
    'Application Software Packages (Word, Excel, etc.)',
    'Basics of Programming',
    
    // Networks
    'Types of Networks (LAN, WAN, MAN)',
    'Network Devices (Switch, Hub, Router, etc.)',
    
    // Internet
    'Internet Services (WWW, E-mail, Search Engines)',
    'Social Media',
    'Web Designing (HTML Basics)',
    
    // Cyber Laws
    'Cyber Crimes',
    'IT Act and Cyber Laws'
];

export const SCIENCE_TECHNOLOGY_SYLLABUS = [
    // General Science & Tech
    'Nature and scope of Science and Technology',
    'Relevance of S&T',
    'National policy on S&T and innovations',
    'Basics of everyday science',
    'Human body',
    'Public Health and Community Medicine',
    'Food and Nutrition',
    'Health Care',
    'Institutes and Organization in India promoting S&T',
    'Contribution of Prominent Indian Scientists',

    // Space and Defence
    'Evolution of Indian Space Programme',
    'ISRO – activities and achievements',
    'Satellite Programmes',
    'DRDO – vision, mission and activities',

    // Energy
    'India\'s existing energy needs and deficit',
    'India\'s energy resources and dependence',
    'Renewable and Non-renewable energy resources',
    'Energy Policy of India',
    'Energy Security and Nuclear Policy of India',

    // Environmental Science
    'Issues and concerns related to environment',
    'Legal aspects, policies and treaties for environment protection',
    'Environment protection for sustainable development',
    'Biodiversity – importance and concerns',
    'Climate change',
    'International initiatives (Policies, Protocols) and India\'s commitment',
    'Western Ghats - Features, Characteristics and issues',
    'Forest and wildlife - Legal framework',
    'Environmental Hazards, Pollution, Carbon Emission, Global Warming',
    'Developments in Biotechnology, Green Technology and Nanotechnology'
];

export const ARTS_SPORTS_SYLLABUS = [
    // Arts (Kala)
    'Visual and Performing Arts in Kerala (Origin, Spread, Training)',
    'Famous Places associated with Arts',
    'Famous Institutions (Arts)',
    'Famous Persons (Arts)',
    'Famous Artists',
    'Famous Writers (Arts Context)',

    // Sports (Kayikam)
    'Famous Athletes (Kerala, India, World) & Achievements',
    'Major Sports Awards and Winners',
    'Major Trophies and Related Sports',
    'Major Sports Items - Number of Players',
    'Key Terms in Sports',
    'Olympics (Basic Info, Venues, Famous Victories)',
    'India\'s Notable Performances in Olympics',
    'Winter Olympics',
    'Para Olympics',
    'Asian Games, Afro-Asian Games, Commonwealth Games, SAFF Games (Venues, Countries, Performance)',
    'National Games (Events, Athletes, Achievements)',
    'National Sports of Countries',

    // Literature (Sahithyam)
    'Major Literary Movements in Malayalam (First Works, Authors)',
    'Major Works and Authors (Malayalam)',
    'Writers - Pen Names and Aliases',
    'Characters and Works',
    'Famous Lines, Works, and Authors',
    'Malayalam Journalism (History, Pioneers, Periodicals)',
    'Major Literary Awards and Honors',
    'Jnanpith Award Winners (Malayalis)',
    'Malayalam Cinema (Origin, Growth, Milestones, Contributors, National Awards)',

    // Culture (Samskaram)
    'Major Festivals in Kerala (Celebrations, Places)',
    'Famous Festivals',
    'Cultural Centers in Kerala',
    'Places of Worship (Culture)',
    'Cultural Leaders and Contributions'
];

export const ARITHMETIC_REASONING_SYLLABUS = [
    // Simple Arithmetic
    'Numbers and Basic Operations',
    'Fraction and Decimal Numbers',
    'Percentage',
    'Profit and Loss',
    'Simple and Compound Interest',
    'Ratio and Proportion',
    'Time and Distance',
    'Time and Work',
    'Average',
    'Laws of Exponents',
    'Mensuration (Perimeter, Area, Volume)',
    'Progressions (Arithmetic and Geometric)',
    
    // Mental Ability
    'Series (Number and Alphabet)',
    'Problems on Mathematical Signs',
    'Position Test',
    'Analogy (Word, Alphabet, Number)',
    'Odd Man Out',
    'Numerical Ability Problems',
    'Coding and Decoding',
    'Family Relations',
    'Sense of Direction',
    'Time and Angles (Clock)',
    'Time in a Clock and its Reflection',
    'Date and Calendar',
    'Clerical Ability'
];

export const GENERAL_ENGLISH_SYLLABUS = [
    // Grammar
    'Types of Sentences and Interchange of Sentences',
    'Different Parts of Speech',
    'Agreement of Verb and Subject',
    'Confusion of Adjectives and Adverbs',
    'Comparison of Adjectives',
    'Adverbs and Position of adverbs',
    'Articles - The Definite and the Indefinite Articles',
    'Uses of Primary and Model Auxiliary Verbs',
    'Tag Questions',
    'Infinitive and Gerunds',
    'Tenses',
    'Tenses in Conditional Sentences',
    'Prepositions',
    'The Use of Correlatives',
    'Direct and Indirect Speech',
    'Active and Passive Voice',
    'Correction of Sentences',

    // Vocabulary
    'Singular & Plural, Change of Gender, Collective Nouns',
    'Word formation from other words and use of prefix or suffix',
    'Compound words',
    'Synonyms',
    'Antonyms',
    'Phrasal Verbs',
    'Foreign Words and Phrases',
    'One Word Substitutes',
    'Words often confused',
    'Spelling Test',
    'Idioms and their Meanings',
    'Translation of a sentence/proverb into Malayalam'
];

export const MALAYALAM_SYLLABUS = [
    'പദശുദ്ധി (Word Purity)',
    'വാക്യശുദ്ധി (Sentence Purity)',
    'പരിഭാഷ (Translation)',
    'ഒറ്റപദം (One Word Substitution)',
    'പര്യായം (Synonyms)',
    'വിപരീത പദം (Antonyms)',
    'ശൈലികൾ പഴഞ്ചൊല്ലുകൾ (Idioms and Proverbs)',
    'സമാനപദം (Equivalent Word)',
    'ചേർത്തെഴുതുക (Join the Word)',
    'സ്ത്രീലിംഗം പുല്ലിംഗം (Gender)',
    'വചനം (Number)',
    'പിരിച്ചെഴുതൽ (Split and Write)',
    'ഘടക പദം (Component Word/Phrase)'
];

// Mapping Subtopics to their Specific Topics (Syllabus)
export const SUBTOPIC_HIERARCHY: Record<string, string[]> = {
  'History': HISTORY_SYLLABUS,
  'Geography': GEOGRAPHY_SYLLABUS,
  'Economics': ECONOMICS_SYLLABUS,
  'Civics': CIVICS_SYLLABUS,
  'Indian Constitution': INDIAN_CONSTITUTION_SYLLABUS,
  'Basics of Computer': COMPUTER_SCIENCE_SYLLABUS,
  'Science and Technology': SCIENCE_TECHNOLOGY_SYLLABUS,
  'Arts, Literature, Culture, Sports': ARTS_SPORTS_SYLLABUS,
  'Simple Arithmetic, Mental Ability, and Reasoning': ARITHMETIC_REASONING_SYLLABUS,
  'General English': GENERAL_ENGLISH_SYLLABUS,
  'Regional Language (Malayalam)': MALAYALAM_SYLLABUS,
  'Current Affairs': [
    'National Events',
    'International Events',
    'Awards and Honors',
    'Sports',
    'Appointments'
  ]
};

export interface Question {
  id: string;
  created_at?: string;
  level: QuestionLevel;
  code?: string;
  name?: string; // Corresponds to Exam Name
  subtopic?: string;
  question: string;
  options: string[];
  correct_answer_index: number;
  explanation?: string;
}

export interface IncorrectAnswer extends Question {
  user_answer_index: number;
}

export type SyncStatus = 'idle' | 'syncing' | 'error';

export type CreateOperation = {
  type: 'create';
  payload: Omit<Question, 'id' | 'created_at'>;
  tempId: string;
};

export type UpdateOperation = {
  type: 'update';
  payload: Question;
};

export type DeleteOperation = {
  type: 'delete';
  payload: { id: string };
};

export type SyncOperation = CreateOperation | UpdateOperation | DeleteOperation;
