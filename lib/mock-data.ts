import { MOCK_CONFIG } from "@/config/api-config";

// Type definitions based on backend models
export interface MockUser {
  id: string;
  name: string;
  email: string;
  lineId: string;
  employeeId: string;
  profilePicture: string | null;
  role: "user" | "admin";
  departmentId: string;
  jobId: string;
  creditsSent: number;
  creditsReceived: number;
  dailyCreditsLimit: number;
  remainingDailyCredits: number;
  createdAt: string;
  updatedAt: string;
  department?: MockDepartment;
  job?: MockJob;
}

export interface MockDepartment {
  id: string;
  name: string;
  description: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MockJob {
  id: string;
  title: string;
  level: number;
  description: string | null;
  departmentId: string;
  createdAt: string;
  updatedAt: string;
}

export interface MockSkillCategory {
  id: string;
  name: string;
  description: string | null;
  color: string;
  icon: string | null;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface MockSkill {
  id: string;
  name: string;
  description: string | null;
  categoryId: string;
  learningMethod: string;
  assessmentMethod: string;
  syllabus: string | null;
  createdAt: string;
  updatedAt: string;
  category?: MockSkillCategory;
}

export interface MockSkillPrerequisite {
  id: string;
  skillId: string;
  prerequisiteSkillId: string;
  createdAt: string;
  updatedAt: string;
  prerequisiteSkill?: MockSkill;
}

export interface MockUserSkill {
  id: string;
  userId: string;
  skillId: string;
  status: "not_started" | "in_progress" | "completed" | "certified";
  score: number | null;
  attempts: number;
  startDate: string | null;
  completionDate: string | null;
  certificationDate: string | null;
  createdAt: string;
  updatedAt: string;
  skill?: MockSkill;
}

export interface MockJobSkill {
  id: string;
  jobId: string;
  skillId: string;
  createdAt: string;
  updatedAt: string;
  skill?: MockSkill;
}

export interface MockCredit {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  reason: string | null;
  createdAt: string;
  updatedAt: string;
  sender?: MockUser;
  receiver?: MockUser;
}

// Mock data generators
const generateId = (prefix: string = "mock"): string =>
  `${prefix}-${Math.random().toString(36).substr(2, 9)}`;

const generateDate = (daysAgo: number = 0): string => {
  const date = new Date();
  date.setDate(date.getDate() - daysAgo);
  return date.toISOString();
};

const randomBetween = (min: number, max: number): number =>
  Math.floor(Math.random() * (max - min + 1)) + min;

const randomChoice = <T>(array: T[]): T =>
  array[Math.floor(Math.random() * array.length)];

// Department data
export const mockDepartments: MockDepartment[] = [
  {
    id: "dept-1",
    name: "工程部",
    description: "軟體開發與技術支援",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "dept-2",
    name: "產品部",
    description: "產品規劃與管理",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "dept-3",
    name: "業務部",
    description: "客戶關係與銷售",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "dept-4",
    name: "人資部",
    description: "人力資源管理",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "dept-5",
    name: "財務部",
    description: "財務規劃與會計",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "dept-6",
    name: "行銷部",
    description: "市場推廣與品牌管理",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "dept-7",
    name: "營運部",
    description: "日常營運與流程管理",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "dept-8",
    name: "客服部",
    description: "客戶服務與技術支援",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
];

// Job data (focused on engineering department progression)
export const mockJobs: MockJob[] = [
  {
    id: "job-1",
    title: "新手村",
    level: 1,
    description: "新進員工培訓階段",
    departmentId: "dept-1",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "job-2",
    title: "助理工程師",
    level: 2,
    description: "初級工程師職位",
    departmentId: "dept-1",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "job-3",
    title: "正式工程師",
    level: 3,
    description: "中級工程師職位",
    departmentId: "dept-1",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "job-4",
    title: "資深工程師",
    level: 4,
    description: "高級工程師職位",
    departmentId: "dept-1",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  // Other department jobs
  {
    id: "job-5",
    title: "產品專員",
    level: 2,
    description: "產品規劃與分析",
    departmentId: "dept-2",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "job-6",
    title: "業務代表",
    level: 2,
    description: "客戶開發與維護",
    departmentId: "dept-3",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "job-7",
    title: "人資專員",
    level: 2,
    description: "招聘與員工關係",
    departmentId: "dept-4",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "job-8",
    title: "會計專員",
    level: 2,
    description: "財務記錄與報表",
    departmentId: "dept-5",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
];

// Skill Categories data
export const mockSkillCategories: MockSkillCategory[] = [
  {
    id: "cat-1",
    name: "山恩DNA",
    description: "公司文化與價值觀相關技能",
    color: "#3B82F6",
    icon: null,
    sortOrder: 1,
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "cat-2",
    name: "產品知識",
    description: "產品相關知識與技能",
    color: "#10B981",
    icon: null,
    sortOrder: 2,
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "cat-3",
    name: "工具使用",
    description: "開發工具與軟體使用技能",
    color: "#F59E0B",
    icon: null,
    sortOrder: 3,
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "cat-4",
    name: "安裝知識",
    description: "系統安裝與配置相關技能",
    color: "#EF4444",
    icon: null,
    sortOrder: 4,
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "cat-5",
    name: "安全操作",
    description: "資訊安全與操作規範",
    color: "#8B5CF6",
    icon: null,
    sortOrder: 5,
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "cat-6",
    name: "程式開發",
    description: "程式設計與開發相關技能",
    color: "#EC4899",
    icon: null,
    sortOrder: 6,
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
];

// Skills data (based on engineering skills tree)
export const mockSkills: MockSkill[] = [
  // 山恩DNA category
  {
    id: "skill-1",
    name: "公司文化認知",
    description: "了解公司價值觀與文化",
    categoryId: "cat-1",
    learningMethod: "實體",
    assessmentMethod: "考卷考核",
    syllabus: "公司價值觀、使命與願景",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-2",
    name: "團隊合作精神",
    description: "具備良好的團隊協作能力",
    categoryId: "cat-1",
    learningMethod: "實體",
    assessmentMethod: "實作考核",
    syllabus: "團隊協作技巧與溝通",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-3",
    name: "創新思維",
    description: "培養創新解決問題的能力",
    categoryId: "cat-1",
    learningMethod: "線上",
    assessmentMethod: "實作考核",
    syllabus: "創新方法論與案例研究",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },

  // 產品知識 category
  {
    id: "skill-4",
    name: "產品架構理解",
    description: "熟悉公司產品的整體架構",
    categoryId: "cat-2",
    learningMethod: "線上",
    assessmentMethod: "考卷考核",
    syllabus: "產品架構圖與技術文件",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-5",
    name: "客戶需求分析",
    description: "能夠分析並理解客戶需求",
    categoryId: "cat-2",
    learningMethod: "實體",
    assessmentMethod: "實作考核",
    syllabus: "需求收集與分析方法",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-6",
    name: "競品分析",
    description: "了解市場競爭產品特性",
    categoryId: "cat-2",
    learningMethod: "線上",
    assessmentMethod: "考卷考核",
    syllabus: "市場分析與競品研究",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },

  // 工具使用 category
  {
    id: "skill-7",
    name: "Git版本控制",
    description: "熟練使用Git進行版本管理",
    categoryId: "cat-3",
    learningMethod: "線上",
    assessmentMethod: "實作考核",
    syllabus: "Git基礎操作與分支管理",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-8",
    name: "IDE開發環境",
    description: "熟悉開發環境的使用",
    categoryId: "cat-3",
    learningMethod: "線上",
    assessmentMethod: "實作考核",
    syllabus: "IDE配置與開發技巧",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-9",
    name: "資料庫操作",
    description: "能夠進行基本資料庫操作",
    categoryId: "cat-3",
    learningMethod: "線上",
    assessmentMethod: "實作考核",
    syllabus: "SQL語法與資料庫設計",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },

  // 安裝知識 category
  {
    id: "skill-10",
    name: "系統環境配置",
    description: "能夠配置開發與測試環境",
    categoryId: "cat-4",
    learningMethod: "實體",
    assessmentMethod: "實作考核",
    syllabus: "開發環境安裝與配置",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-11",
    name: "部署流程",
    description: "了解應用程式部署流程",
    categoryId: "cat-4",
    learningMethod: "實體",
    assessmentMethod: "實作考核",
    syllabus: "CI/CD流程與部署策略",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-12",
    name: "監控與維護",
    description: "能夠監控系統運行狀態",
    categoryId: "cat-4",
    learningMethod: "線上",
    assessmentMethod: "考卷考核",
    syllabus: "系統監控與日誌分析",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },

  // 安全操作 category
  {
    id: "skill-13",
    name: "資安基礎",
    description: "了解基本資訊安全概念",
    categoryId: "cat-5",
    learningMethod: "線上",
    assessmentMethod: "考卷考核",
    syllabus: "資訊安全基礎知識",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-14",
    name: "安全編程",
    description: "能夠編寫安全的程式碼",
    categoryId: "cat-5",
    learningMethod: "線上",
    assessmentMethod: "實作考核",
    syllabus: "安全編程最佳實務",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-15",
    name: "權限管理",
    description: "了解系統權限管理機制",
    categoryId: "cat-5",
    learningMethod: "實體",
    assessmentMethod: "考卷考核",
    syllabus: "存取控制與權限設計",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },

  // 程式開發 category
  {
    id: "skill-16",
    name: "架構設計",
    description: "能夠設計系統架構",
    categoryId: "cat-6",
    learningMethod: "線上",
    assessmentMethod: "實作考核",
    syllabus: "軟體架構設計模式",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-17",
    name: "性能優化",
    description: "能夠優化系統性能",
    categoryId: "cat-6",
    learningMethod: "線上",
    assessmentMethod: "實作考核",
    syllabus: "效能調校與最佳化",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-18",
    name: "技術領導",
    description: "具備技術團隊領導能力",
    categoryId: "cat-1",
    learningMethod: "實體",
    assessmentMethod: "實作考核",
    syllabus: "技術領導與團隊管理",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-19",
    name: "專案管理",
    description: "能夠管理技術專案",
    categoryId: "cat-1",
    learningMethod: "實體",
    assessmentMethod: "實作考核",
    syllabus: "敏捷開發與專案管理",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "skill-20",
    name: "跨團隊協作",
    description: "能夠協調多個團隊合作",
    categoryId: "cat-1",
    learningMethod: "實體",
    assessmentMethod: "實作考核",
    syllabus: "跨部門溝通與協作",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
];

// Skill Prerequisites data (skill dependencies)
export const mockSkillPrerequisites: MockSkillPrerequisite[] = [
  // 產品架構理解 requires 公司文化認知
  {
    id: "prereq-1",
    skillId: "skill-4",
    prerequisiteSkillId: "skill-1",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  // 客戶需求分析 requires 產品架構理解
  {
    id: "prereq-2", 
    skillId: "skill-5",
    prerequisiteSkillId: "skill-4",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  // 資料庫操作 requires Git版本控制
  {
    id: "prereq-3",
    skillId: "skill-9",
    prerequisiteSkillId: "skill-7",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  // 部署流程 requires 系統環境配置
  {
    id: "prereq-4",
    skillId: "skill-11",
    prerequisiteSkillId: "skill-10",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  // 監控與維護 requires 部署流程
  {
    id: "prereq-5",
    skillId: "skill-12",
    prerequisiteSkillId: "skill-11",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  // 安全編程 requires 資安基礎
  {
    id: "prereq-6",
    skillId: "skill-14",
    prerequisiteSkillId: "skill-13",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  // 架構設計 requires 安全編程
  {
    id: "prereq-7",
    skillId: "skill-16",
    prerequisiteSkillId: "skill-14",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  // 性能優化 requires 架構設計
  {
    id: "prereq-8",
    skillId: "skill-17",
    prerequisiteSkillId: "skill-16",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
];

// Job-Skill relationships (what skills are required for each job)
export const mockJobSkills: MockJobSkill[] = [
  // 新手村 (job-1) - Basic skills
  {
    id: "js-1",
    jobId: "job-1",
    skillId: "skill-1",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-2",
    jobId: "job-1",
    skillId: "skill-2",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-3",
    jobId: "job-1",
    skillId: "skill-4",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-4",
    jobId: "job-1",
    skillId: "skill-7",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-5",
    jobId: "job-1",
    skillId: "skill-8",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },

  // 助理工程師 (job-2)
  {
    id: "js-6",
    jobId: "job-2",
    skillId: "skill-1",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-7",
    jobId: "job-2",
    skillId: "skill-2",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-8",
    jobId: "job-2",
    skillId: "skill-4",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-9",
    jobId: "job-2",
    skillId: "skill-7",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-10",
    jobId: "job-2",
    skillId: "skill-8",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-11",
    jobId: "job-2",
    skillId: "skill-9",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-12",
    jobId: "job-2",
    skillId: "skill-13",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-13",
    jobId: "job-2",
    skillId: "skill-5",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-14",
    jobId: "job-2",
    skillId: "skill-10",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },

  // 正式工程師 (job-3)
  {
    id: "js-15",
    jobId: "job-3",
    skillId: "skill-3",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-16",
    jobId: "job-3",
    skillId: "skill-5",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-17",
    jobId: "job-3",
    skillId: "skill-10",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-18",
    jobId: "job-3",
    skillId: "skill-11",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-19",
    jobId: "job-3",
    skillId: "skill-14",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-20",
    jobId: "job-3",
    skillId: "skill-15",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-21",
    jobId: "job-3",
    skillId: "skill-16",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-22",
    jobId: "job-3",
    skillId: "skill-17",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },

  // 資深工程師 (job-4)
  {
    id: "js-23",
    jobId: "job-4",
    skillId: "skill-16",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-24",
    jobId: "job-4",
    skillId: "skill-17",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-25",
    jobId: "job-4",
    skillId: "skill-18",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-26",
    jobId: "job-4",
    skillId: "skill-19",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
  {
    id: "js-27",
    jobId: "job-4",
    skillId: "skill-20",
    createdAt: generateDate(365),
    updatedAt: generateDate(30),
  },
];

// Generate mock users
const generateMockUsers = (): MockUser[] => {
  const users: MockUser[] = [];

  // Current user (for consistent experience)
  users.push({
    id: MOCK_CONFIG.currentUserId,
    name: "張小明",
    email: "ming.zhang@saiens.com",
    lineId: "line-mock-user-1",
    employeeId: "EMP001",
    profilePicture: "https://i.pravatar.cc/150?img=1",
    role: MOCK_CONFIG.currentUserRole,
    departmentId: "dept-1",
    jobId: "job-2", // 助理工程師
    creditsSent: randomBetween(50, 200),
    creditsReceived: randomBetween(100, 300),
    dailyCreditsLimit: randomBetween(
      MOCK_CONFIG.dailyCreditLimit.min,
      MOCK_CONFIG.dailyCreditLimit.max
    ),
    remainingDailyCredits: randomBetween(0, 20),
    createdAt: generateDate(180),
    updatedAt: generateDate(1),
  });

  // Generate other users
  const firstNames = [
    "王",
    "李",
    "陳",
    "林",
    "張",
    "黃",
    "吳",
    "劉",
    "蔡",
    "楊",
    "許",
    "鄭",
    "謝",
    "洪",
    "邱",
  ];
  const lastNames = [
    "大明",
    "小美",
    "志強",
    "淑芬",
    "建國",
    "雅婷",
    "俊傑",
    "玉琴",
    "家豪",
    "佩珊",
    "承翰",
    "怡君",
    "宏偉",
    "麗華",
    "振宇",
  ];

  for (let i = 2; i <= MOCK_CONFIG.userCount; i++) {
    const firstName = randomChoice(firstNames);
    const lastName = randomChoice(lastNames);
    const name = `${firstName}${lastName}`;
    const dept = randomChoice(mockDepartments);
    const jobsInDept = mockJobs.filter((job) => job.departmentId === dept.id);
    const job =
      jobsInDept.length > 0 ? randomChoice(jobsInDept) : randomChoice(mockJobs);

    users.push({
      id: `mock-user-${i}`,
      name,
      email: `${name.toLowerCase()}@saiens.com`,
      lineId: `line-mock-user-${i}`,
      employeeId: `EMP${i.toString().padStart(3, "0")}`,
      profilePicture: `https://i.pravatar.cc/150?img=${i}`,
      role: i <= 5 ? "admin" : "user", // First 5 users are admins
      departmentId: dept.id,
      jobId: job.id,
      creditsSent: randomBetween(10, 500),
      creditsReceived: randomBetween(20, 400),
      dailyCreditsLimit: randomBetween(
        MOCK_CONFIG.dailyCreditLimit.min,
        MOCK_CONFIG.dailyCreditLimit.max
      ),
      remainingDailyCredits: randomBetween(0, 30),
      createdAt: generateDate(randomBetween(30, 365)),
      updatedAt: generateDate(randomBetween(0, 30)),
    });
  }

  return users;
};

// Generate mock user skills (progress tracking)
const generateMockUserSkills = (users: MockUser[]): MockUserSkill[] => {
  const userSkills: MockUserSkill[] = [];

  users.forEach((user) => {
    // Get required skills for user's job
    const jobSkills = mockJobSkills.filter((js) => js.jobId === user.jobId);
    const skillIds = jobSkills.map((js) => js.skillId);

    // Add some additional random skills
    const additionalSkills = mockSkills
      .filter((skill) => !skillIds.includes(skill.id))
      .sort(() => 0.5 - Math.random())
      .slice(0, randomBetween(3, 8))
      .map((skill) => skill.id);

    const allUserSkillIds = [...skillIds, ...additionalSkills];

    allUserSkillIds.forEach((skillId, index) => {
      // Ensure some skills are completed without evaluation (pending evaluation)
      let status: string;
      let score: number | null = null;

      if (index < 2 && user.id !== MOCK_CONFIG.currentUserId) {
        // First 2 skills per user (except current user) are completed but need evaluation
        status = "completed";
        score = null; // No score yet - needs evaluation
      } else {
        status = randomChoice([
          "not_started",
          "in_progress",
          "completed",
          "certified",
        ]);
        const hasScore = status === "completed" || status === "certified";
        score = hasScore
          ? randomBetween(
              MOCK_CONFIG.skillScore.min,
              MOCK_CONFIG.skillScore.max
            )
          : null;
      }

      const attempts = status !== "not_started" ? randomBetween(1, 3) : 0;

      let startDate = null;
      let completionDate = null;
      let certificationDate = null;

      if (status !== "not_started") {
        startDate = generateDate(randomBetween(10, 100));
        if (status === "completed" || status === "certified") {
          completionDate = generateDate(randomBetween(1, 50));
          if (status === "certified") {
            certificationDate = generateDate(randomBetween(0, 30));
          }
        }
      }

      userSkills.push({
        id: generateId("us"),
        userId: user.id,
        skillId,
        status,
        score,
        attempts,
        startDate,
        completionDate,
        certificationDate,
        createdAt: generateDate(randomBetween(30, 180)),
        updatedAt: generateDate(randomBetween(0, 30)),
      });
    });
  });

  return userSkills;
};

// Generate mock credits
const generateMockCredits = (users: MockUser[]): MockCredit[] => {
  const credits: MockCredit[] = [];

  users.forEach((user) => {
    const creditCount = randomBetween(5, MOCK_CONFIG.creditTransactionsPerUser);

    for (let i = 0; i < creditCount; i++) {
      const otherUsers = users.filter((u) => u.id !== user.id);
      const otherUser = randomChoice(otherUsers);
      const isReceiving = Math.random() > 0.5;

      const senderId = isReceiving ? otherUser.id : user.id;
      const receiverId = isReceiving ? user.id : otherUser.id;

      const reasons = [
        "協助解決技術問題",
        "優秀的團隊合作",
        "創新思維提案",
        "主動幫助同事",
        "專案準時完成",
        "知識分享",
        "客戶服務優良",
        "程式碼品質優秀",
        "問題解決能力",
        "積極學習態度",
      ];

      credits.push({
        id: generateId("credit"),
        senderId,
        receiverId,
        amount: randomBetween(
          MOCK_CONFIG.creditAmount.min,
          MOCK_CONFIG.creditAmount.max
        ),
        reason: Math.random() > 0.3 ? randomChoice(reasons) : null,
        createdAt: generateDate(randomBetween(0, 180)),
        updatedAt: generateDate(randomBetween(0, 180)),
      });
    }
  });

  return credits.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
};

// Export generated data
export const mockUsers = generateMockUsers();
export const mockUserSkills = generateMockUserSkills(mockUsers);
export const mockCredits = generateMockCredits(mockUsers);

// Helper functions for data relationships
export const getUserWithRelations = (userId: string): MockUser | undefined => {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return undefined;

  return {
    ...user,
    department: mockDepartments.find((d) => d.id === user.departmentId),
    job: mockJobs.find((j) => j.id === user.jobId),
  };
};

export const getSkillsWithProgress = (userId: string): MockUserSkill[] => {
  return mockUserSkills
    .filter((us) => us.userId === userId)
    .map((us) => ({
      ...us,
      skill: mockSkills.find((s) => s.id === us.skillId),
    }));
};

export const getJobSkillsWithDetails = (jobId: string): MockJobSkill[] => {
  return mockJobSkills
    .filter((js) => js.jobId === jobId)
    .map((js) => ({
      ...js,
      skill: mockSkills.find((s) => s.id === js.skillId),
    }));
};

export const getCreditsWithUsers = (credits: MockCredit[]): MockCredit[] => {
  return credits.map((credit) => ({
    ...credit,
    sender: mockUsers.find((u) => u.id === credit.senderId),
    receiver: mockUsers.find((u) => u.id === credit.receiverId),
  }));
};

export const getDepartmentJobProgression = (userId: string) => {
  const user = mockUsers.find((u) => u.id === userId);
  if (!user) return null;

  const department = mockDepartments.find((d) => d.id === user.departmentId);
  const currentJob = mockJobs.find((j) => j.id === user.jobId);

  // Get all jobs in the same department, sorted by level
  const departmentJobs = mockJobs
    .filter((j) => j.departmentId === user.departmentId)
    .sort((a, b) => a.level - b.level);

  // For each job, get skills with user progress
  const jobProgression = departmentJobs.map((job) => {
    const jobSkills = mockJobSkills.filter((js) => js.jobId === job.id);
    const skillsWithProgress = jobSkills.map((js) => {
      const skill = mockSkills.find((s) => s.id === js.skillId);
      const userProgress = mockUserSkills.find(
        (us) => us.userId === userId && us.skillId === js.skillId
      );

      return {
        ...js,
        Skill: skill,
        userProgress: userProgress
          ? {
              id: userProgress.id,
              status: userProgress.status,
              score: userProgress.score,
              startedAt: userProgress.startDate,
              completedAt: userProgress.completionDate,
              evaluatedAt: userProgress.certificationDate,
              evaluationRequestedAt: null, // Mock doesn't have this field
              attempts: userProgress.attempts,
            }
          : null,
      };
    });

    return {
      id: job.id,
      name: job.title,
      level: job.level,
      description: job.description,
      isCurrentJob: job.id === user.jobId,
      skillsWithProgress,
    };
  });

  return {
    department: department?.name,
    currentJob: currentJob?.title,
    jobProgression,
  };
};
