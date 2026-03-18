import React, { useState, useEffect, useRef } from 'react';
import { 
  Dumbbell, CalendarDays, History, Trophy, ChevronRight, CheckCircle2, Flame, Eye, ArrowRight,
  Utensils, Sunrise, Sunset, Moon, Zap, Play, RotateCcw, Activity, AlertTriangle, Battery,
  SkipForward, XCircle, ArrowLeft, Timer, Sparkles, MessageSquare, Send, ChefHat, Loader2,
  X, Menu, Info, User, Settings, Scale, Ruler, Camera, TrendingUp, TrendingDown, Target,
  Award, Star, Crown, Medal, Pause, Volume2, VolumeX, Plus, Minus, Edit3, Save, Trash2,
  Droplets, Heart, Moon as MoonIcon, Sun, BarChart3, LineChart, Goal, Clock, Bookmark,
  Edit, ListChecks, Shuffle, Share2, Download, Upload, Bell, BellOff, ChevronDown, ChevronUp,
  Cloud, HardDrive, Database
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { auth, db, signInWithGoogle, firebaseConfig } from './firebase-config';
import { onAuthStateChanged, signOut } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  updateDoc,
  serverTimestamp 
} from 'firebase/firestore';
import { MigrationDialog, MigrationSuccessDialog } from './components/MigrationDialog';
import { 
  checkForLocalData, 
  checkForRemoteData, 
  mergeLocalAndRemoteData,
  saveUserDataToFirestore,
  getUserDataFromFirestore
} from './services/migrationService';

// --- Feature Flags (auto-disabled if keys not set) ---
const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const IS_GEMINI_ENABLED = !!GEMINI_API_KEY;

// Check if Firebase is configured
const IS_FIREBASE_ENABLED = () => {
  try {
    // Check if firebase-config exports are valid (not placeholder values)
    if (!auth || !db) return false;
    // Check if firebaseConfig has placeholder values
    if (firebaseConfig.apiKey === "YOUR_API_KEY" || 
        firebaseConfig.projectId === "YOUR_PROJECT_ID") {
      return false;
    }
    return true;
  } catch (e) {
    return false;
  }
};

async function callGemini(prompt) {
  if (!IS_GEMINI_ENABLED) return "Gemini API key not configured. Add VITE_GEMINI_API_KEY to use AI features.";

  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent?key=${GEMINI_API_KEY}`;
  const payload = { contents: [{ parts: [{ text: prompt }] }] };

  const delays = [1000, 2000, 4000];
  for (let i = 0; i <= delays.length; i++) {
    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!response.ok) {
        if (response.status === 429 && i < delays.length) {
          await new Promise(resolve => setTimeout(resolve, delays[i]));
          continue;
        }
        throw new Error(`API Error: ${response.status}`);
      }
      const data = await response.json();
      return data.candidates?.[0]?.content?.parts?.[0]?.text || "Sorry, I couldn't think of a response.";
    } catch (error) {
      if (i === delays.length) console.error(error);
    }
  }
  return "Connection error. Please try again.";
}

// --- TRANSLATIONS & DATA ---

const TRANSLATIONS = {
  en: {
    welcome: "Welcome, Champ",
    subtitleMachine: "Machine Edition",
    subtitleDumbbell: "Free Weight Edition",
    streak: "Streak",
    status: "Status",
    active: "Active",
    recommended: "Recommended Today",
    startWorkout: "Start Workout",
    resumeWorkout: "Resume Workout",
    discard: "Discard",
    foodTracker: "Food Tracker",
    trackGoal: "Track your 120g protein.",
    plan: "Plan",
    food: "Food",
    history: "History",
    timeline: "Timeline",
    dangerZone: "DANGER: Muscle Starvation",
    maintZone: "MAINTENANCE: Staying Safe",
    growthZone: "GROWTH: Muscles Building!",
    reset: "Reset Day",
    warmupTitle: "🔥 Warm Up",
    dontSkip: "⚠️ Don't Skip!",
    warmupDesc: "Cold muscles break easily. Do these 3 moves first.",
    startLifting: "Start Lifting (Finish Warmup)",
    skipWarmup: "Skip Warmup",
    finishWorkout: "Finish Workout",
    saving: "Saving...",
    back: "Back",
    loading: "Loading IronStart...",
    noWorkouts: "No workouts yet.",
    exercisesCount: "Exercises",
    startDay: "Start Day",
    morning: "Morning",
    preGym: "Before Gym (2hrs)",
    postGym: "IMMEDIATELY AFTER",
    dinner: "Dinner",
    snack: "Night Snack",
    workoutComplete: "Workout Complete!",
    greatJob: "Great job, Champ!",
    timeTaken: "Time Taken",
    minutes: "min",
    backHome: "Back to Home",
    askCoach: "Ask IronCoach",
    coachIntro: "I'm IronCoach. I know your stats (165cm, 59kg). Ask me about form, diet, or motivation!",
    typeQuestion: "Type your question...",
    suggestSnack: "Suggest Snack",
    snackPrompt: "Generate a simple, high-protein snack recipe (under 5 ingredients) to help fill a protein gap. Keep it concise.",
    coachThinking: "Coach is thinking...",
    chefThinking: "Chef is cooking...",
    menuTitle: "Menu",
    profile: "Profile: 165cm, 59kg",
    appVersion: "Version 2.0 (Enhanced)",
    aboutApp: "IronStart",
    switchedTo: "Switched to",
    machineMode: "Machine Mode",
    dumbbellMode: "Dumbbell Mode",
    // Metrics
    metrics: "Metrics",
    weight: "Weight",
    height: "Height",
    bodyFat: "Body Fat",
    chest: "Chest",
    arms: "Arms",
    waist: "Waist",
    thighs: "Thighs",
    addMetric: "Add Metric",
    updateProgress: "Update Progress",
    personalRecords: "Personal Records",
    noPRs: "No records yet. Start lifting!",
    kg: "kg",
    cm: "cm",
    lbs: "lbs",
    // Rest Timer
    restTimer: "Rest Timer",
    restComplete: "Rest Complete!",
    tapToStart: "Tap to start",
    skipRest: "Skip Rest",
    addWeight: "Add Weight",
    reps: "Reps",
    sets: "Sets",
    weightLifted: "Weight Lifted",
    totalVolume: "Total Volume",
    // Achievements
    achievements: "Achievements",
    streakDays: "day streak",
    firstWorkout: "First Workout",
    streak5: "5 Day Streak",
    streak10: "10 Day Streak",
    volume100: "100kg Club",
    volume500: "500kg Club",
    volume1000: "1000kg Club",
    prBreaker: "PR Breaker",
    level: "Level",
    xp: "XP",
    nextLevel: "to next level",
    // Wellness
    water: "Water",
    waterGoal: "8 glasses/day",
    glasses: "glasses",
    energy: "Energy",
    mood: "Mood",
    sleep: "Sleep",
    logWellness: "Log Wellness",
    excellent: "Excellent",
    good: "Good",
    okay: "Okay",
    tired: "Tired",
    exhausted: "Exhausted",
    // NEW: Goals
    goals: "Goals",
    setGoal: "Set Goal",
    currentGoal: "Current Goal",
    goalWeight: "Target Weight",
    goalWorkouts: "Weekly Workouts",
    goalProtein: "Daily Protein",
    goalStreak: "Streak Goal",
    noGoalSet: "No goal set",
    daysLeft: "days left",
    onTrack: "On Track!",
    behind: "Behind Schedule",
    // NEW: Exercise Timer
    exerciseTimer: "Exercise Timer",
    startTimer: "Start Timer",
    pauseTimer: "Pause",
    resetTimer: "Reset",
    seconds: "sec",
    // NEW: Notes
    notes: "Notes",
    addNote: "Add Note",
    workoutNotes: "Workout Notes",
    saveNote: "Save Note",
    // NEW: Custom Workouts
    customWorkouts: "Custom Workouts",
    createWorkout: "Create Workout",
    workoutName: "Workout Name",
    addExercise: "Add Exercise",
    selectExercise: "Select Exercise",
    saveWorkout: "Save Workout",
    deleteWorkout: "Delete",
    myWorkouts: "My Workouts",
    noCustomWorkouts: "No custom workouts yet",
    // NEW: Progress
    progress: "Progress",
    weeklySummary: "Weekly Summary",
    monthlyProgress: "Monthly Progress",
    totalWorkouts: "Total Workouts",
    avgVolume: "Avg Volume",
    bestDay: "Best Day",
    thisWeek: "This Week",
    lastWeek: "Last Week",
    improvement: "improvement",
    // NEW: Dashboard
    dashboard: "Dashboard",
    quickStats: "Quick Stats",
    todayPlan: "Today's Plan",
    upcomingWorkout: "Upcoming Workout",
    restDay: "Rest Day",
    // NEW: Notifications
    reminders: "Reminders",
    enableReminders: "Enable Reminders",
    workoutReminder: "Workout Reminder",
    waterReminder: "Water Reminder",
    proteinReminder: "Protein Reminder",
    // NEW: Share & Export
    shareProgress: "Share Progress",
    exportData: "Export Data",
    importData: "Import Data"
  },
  zh: {
    welcome: "歡迎回來，冠軍",
    subtitleMachine: "器械訓練版",
    subtitleDumbbell: "自由重量版",
    streak: "連續打卡",
    status: "狀態",
    active: "活躍",
    recommended: "今日推薦",
    startWorkout: "開始訓練",
    resumeWorkout: "繼續訓練",
    discard: "放棄本次",
    foodTracker: "飲食追蹤",
    trackGoal: "目標：120g 蛋白質",
    plan: "計畫",
    food: "飲食",
    history: "歷史",
    timeline: "時間軸",
    dangerZone: "危險區：肌肉飢餓",
    maintZone: "維持期：保持健康",
    growthZone: "增長期：肌肉生長中！",
    reset: "重置",
    warmupTitle: "🔥 熱身環節",
    dontSkip: "⚠️ 切勿跳過！",
    warmupDesc: "冷肌肉容易受傷。請先完成這3個動作。",
    startLifting: "開始正式訓練 (完成熱身)",
    skipWarmup: "跳過熱身",
    finishWorkout: "完成訓練",
    saving: "保存中...",
    back: "返回",
    loading: "載入中...",
    noWorkouts: "暫無訓練記錄",
    exercisesCount: "個動作",
    startDay: "開始",
    morning: "早餐",
    preGym: "練前餐 (2小時前)",
    postGym: "練後立即補充",
    dinner: "晚餐",
    snack: "宵夜",
    workoutComplete: "訓練完成！",
    greatJob: "幹得漂亮，冠軍！",
    timeTaken: "用時",
    minutes: "分鐘",
    backHome: "返回主頁",
    askCoach: "咨詢 IronCoach",
    coachIntro: "我是 IronCoach。我知道你的數據 (165cm, 59kg)。關於動作、飲食或動力的問題儘管問！",
    typeQuestion: "輸入你的問題...",
    suggestSnack: "推薦零食",
    snackPrompt: "生成一個簡單的高蛋白零食食譜（少於5種原料）來補充蛋白質缺口。保持簡潔。",
    coachThinking: "教練思考中...",
    chefThinking: "廚師烹飪中...",
    menuTitle: "選單",
    profile: "檔案: 165cm, 59kg",
    appVersion: "版本 2.0 (增強版)",
    aboutApp: "IronStart",
    switchedTo: "已切換至",
    machineMode: "器械模式",
    dumbbellMode: "自由重量模式",
    // Metrics
    metrics: "數據",
    weight: "體重",
    height: "身高",
    bodyFat: "體脂",
    chest: "胸圍",
    arms: "臂圍",
    waist: "腰圍",
    thighs: "大腿圍",
    addMetric: "添加數據",
    updateProgress: "更新進度",
    personalRecords: "個人記錄",
    noPRs: "暫無記錄，開始訓練吧！",
    kg: "公斤",
    cm: "厘米",
    lbs: "磅",
    // Rest Timer
    restTimer: "休息計時",
    restComplete: "休息完畢！",
    tapToStart: "點擊開始",
    skipRest: "跳過休息",
    addWeight: "添加重量",
    reps: "次數",
    sets: "組數",
    weightLifted: "舉起重量",
    totalVolume: "總訓練量",
    // Achievements
    achievements: "成就",
    streakDays: "天連續",
    firstWorkout: "首次訓練",
    streak5: "5天連續",
    streak10: "10天連續",
    volume100: "100公斤俱樂部",
    volume500: "500公斤俱樂部",
    volume1000: "1000公斤俱樂部",
    prBreaker: "破紀錄者",
    level: "等級",
    xp: "經驗值",
    nextLevel: "升級所需",
    // Wellness
    water: "飲水",
    waterGoal: "8杯/天",
    glasses: "杯",
    energy: "精力",
    mood: "心情",
    sleep: "睡眠",
    logWellness: "記錄狀態",
    excellent: "極佳",
    good: "良好",
    okay: "一般",
    tired: "疲勞",
    exhausted: "精疲力竭",
    // NEW: Goals
    goals: "目標",
    setGoal: "設定目標",
    currentGoal: "當前目標",
    goalWeight: "目標體重",
    goalWorkouts: "每週訓練",
    goalProtein: "每日蛋白",
    goalStreak: "連續目標",
    noGoalSet: "未設定目標",
    daysLeft: "天剩餘",
    onTrack: "進度達標！",
    behind: "進度落後",
    // NEW: Exercise Timer
    exerciseTimer: "動作計時",
    startTimer: "開始計時",
    pauseTimer: "暫停",
    resetTimer: "重置",
    seconds: "秒",
    // NEW: Notes
    notes: "筆記",
    addNote: "添加筆記",
    workoutNotes: "訓練筆記",
    saveNote: "保存筆記",
    // NEW: Custom Workouts
    customWorkouts: "自定訓練",
    createWorkout: "創建訓練",
    workoutName: "訓練名稱",
    addExercise: "添加動作",
    selectExercise: "選擇動作",
    saveWorkout: "保存訓練",
    deleteWorkout: "刪除",
    myWorkouts: "我的訓練",
    noCustomWorkouts: "暫無自定訓練",
    // NEW: Progress
    progress: "進度",
    weeklySummary: "本週總結",
    monthlyProgress: "月度進度",
    totalWorkouts: "總訓練",
    avgVolume: "平均訓練量",
    bestDay: "最佳日",
    thisWeek: "本週",
    lastWeek: "上週",
    improvement: "提升",
    // NEW: Dashboard
    dashboard: "儀表板",
    quickStats: "快速統計",
    todayPlan: "今日計畫",
    upcomingWorkout: "即將訓練",
    restDay: "休息日",
    // NEW: Notifications
    reminders: "提醒",
    enableReminders: "啟用提醒",
    workoutReminder: "訓練提醒",
    waterReminder: "飲水提醒",
    proteinReminder: "蛋白質提醒",
    // NEW: Share & Export
    shareProgress: "分享進度",
    exportData: "導出數據",
    importData: "導入數據"
  }
};

const WARMUP_DATA = {
  en: [
    { id: 'w1', name: 'Treadmill Walk', visual: 'treadmill_walk', duration: '5 Mins', cue: 'Conversational Pace (100-120 BPM). Do not sprint.' },
    { id: 'w2', name: 'Arm Circles', visual: 'arm_circles', duration: '30 Secs', cue: 'Big circles forward and backward.' },
    { id: 'w3', name: 'Torso Twists', visual: 'torso_twist', duration: '30 Secs', cue: 'Twist left and right to loosen back.' }
  ],
  zh: [
    { id: 'w1', name: '跑步机快走', visual: 'treadmill_walk', duration: '5 分钟', cue: '保持可对话的节奏 (100-120 BPM)。不要冲刺。' },
    { id: 'w2', name: '手臂绕环', visual: 'arm_circles', duration: '30 秒', cue: '向前向后大幅度绕环。' },
    { id: 'w3', name: '躯干扭转', visual: 'torso_twist', duration: '30 秒', cue: '左右扭转，放松背部。' }
  ]
};

const WORKOUTS_DATA = {
  en: {
    machine: {
      A: {
        name: "Workout A: Push (Machine)",
        focus: "Chest, Shoulders, Legs",
        exercises: [
          { id: 'ma1', visual: 'leg_press', name: 'Leg Press Machine', sets: 3, reps: '10-12', cue: 'Adjust seat so knees are 90°. Push platform away, do not lock knees.', defaultWeight: 100 },
          { id: 'ma2', visual: 'chest_press_machine', name: 'Seated Chest Press', sets: 3, reps: '10-12', cue: 'Handles at chest height. Push forward, squeeze chest.', defaultWeight: 40 },
          { id: 'ma3', visual: 'shoulder_press_machine', name: 'Shoulder Press Machine', sets: 3, reps: '10-12', cue: 'Keep core tight. Push handles straight up.', defaultWeight: 30 },
          { id: 'ma4', visual: 'tricep_pushdown', name: 'Tricep Cable Pushdown', sets: 3, reps: '12-15', cue: 'Keep elbows glued to your sides. Push hands down to thighs.', defaultWeight: 20 },
          { id: 'ma5', visual: 'ab_crunch_machine', name: 'Ab Crunch Machine', sets: 3, reps: '15-20', cue: 'Hold handles. Curl your chest down towards knees. Squeeze abs.', defaultWeight: 30 },
        ]
      },
      B: {
        name: "Workout B: Pull (Machine)",
        focus: "Back, Hamstrings, Biceps",
        exercises: [
          { id: 'mb1', visual: 'lat_pulldown', name: 'Lat Pulldown', sets: 3, reps: '10-12', cue: 'Wide grip. Lean back slightly. Pull bar to upper chest.', defaultWeight: 40 },
          { id: 'mb2', visual: 'seated_row_machine', name: 'Seated Row Machine', sets: 3, reps: '10-12', cue: 'Chest against pad. Pull handles back, squeeze shoulder blades.', defaultWeight: 35 },
          { id: 'mb3', visual: 'leg_curl', name: 'Seated Leg Curl', sets: 3, reps: '12-15', cue: 'Adjust roller to ankle. Curl legs back/down underneath you.', defaultWeight: 30 },
          { id: 'mb4', visual: 'back_extension', name: 'Back Extension', sets: 3, reps: '10-12', cue: 'Keep back straight. Hinge at hips to lean forward, then pull up.', defaultWeight: 0 },
          { id: 'mb5', visual: 'bicep_machine', name: 'Bicep Curl Machine', sets: 3, reps: '12', cue: 'Back of arms flat against pad. Curl handles up.', defaultWeight: 25 },
        ]
      }
    },
    dumbbell: {
      A: {
        name: "Workout A: Push (Free Weight)",
        focus: "Chest, Shoulders, Legs",
        exercises: [
          { id: 'da1', visual: 'goblet_squat', name: 'Goblet Squats', sets: 3, reps: '10-12', cue: 'Hold one dumbbell at chest. Sit back like sitting in a chair.', defaultWeight: 20 },
          { id: 'da2', visual: 'dumbbell_press', name: 'Dumbbell Chest Press', sets: 3, reps: '10-12', cue: 'Lie on bench. Press weights up over chest, bring down slowly.', defaultWeight: 15 },
          { id: 'da3', visual: 'dumbbell_shoulder_press', name: 'Seated Shoulder Press', sets: 3, reps: '10-12', cue: 'Back straight. Press dumbbells overhead. Dont arch back.', defaultWeight: 12 },
          { id: 'da4', visual: 'plank', name: 'Plank', sets: 3, reps: '30-45s', cue: 'Body in straight line. Squeeze glutes and abs tight.', defaultWeight: 0, isTimed: true },
          { id: 'da5', visual: 'push_ups', name: 'Push-Ups', sets: 3, reps: 'Max', cue: 'Chest to floor. Keep body straight.', defaultWeight: 0 },
        ]
      },
      B: {
        name: "Workout B: Pull (Free Weight)",
        focus: "Back, Hamstrings, Biceps",
        exercises: [
          { id: 'db1', visual: 'rdl', name: 'Romanian Deadlift', sets: 3, reps: '10-12', cue: 'Hips back! Keep back flat. Feel stretch in hamstrings.', defaultWeight: 20 },
          { id: 'db2', visual: 'dumbbell_row', name: 'Dumbbell Row', sets: 3, reps: '10-12', cue: 'Hand on bench. Pull weight to hip. Squeeze back.', defaultWeight: 15 },
          { id: 'db3', visual: 'lat_pulldown', name: 'Lat Pulldown', sets: 3, reps: '10-12', cue: 'Wide grip. Pull bar to upper chest. (Use machine if available).', defaultWeight: 40 },
          { id: 'db4', visual: 'dumbbell_curl', name: 'Dumbbell Bicep Curls', sets: 3, reps: '12', cue: 'Elbows by sides. Curl up without swinging body.', defaultWeight: 10 },
          { id: 'db5', visual: 'back_extension', name: 'Back Extension', sets: 3, reps: '10-12', cue: 'Use bench or machine. Lower torso, then raise to neutral.', defaultWeight: 0 },
        ]
      }
    }
  },
  zh: {
    machine: {
      A: {
        name: "訓練 A: 推 (器械)",
        focus: "胸部, 肩部, 大腿前側",
        exercises: [
          { id: 'ma1', visual: 'leg_press', name: '坐姿蹬腿', sets: 3, reps: '10-12', cue: '調整座椅使膝蓋呈90度。蹬開踏板，膝蓋不要鎖死。', defaultWeight: 100 },
          { id: 'ma2', visual: 'chest_press_machine', name: '坐姿推胸', sets: 3, reps: '10-12', cue: '把手與胸部齊平。向前推，擠壓胸部肌肉。', defaultWeight: 40 },
          { id: 'ma3', visual: 'shoulder_press_machine', name: '坐姿推肩', sets: 3, reps: '10-12', cue: '收緊核心。雙手向上推舉。', defaultWeight: 30 },
          { id: 'ma4', visual: 'tricep_pushdown', name: '繩索下壓 (三頭肌)', sets: 3, reps: '12-15', cue: '大臂夾緊身體兩側。雙手向下壓至大腿處。', defaultWeight: 20 },
          { id: 'ma5', visual: 'ab_crunch_machine', name: '捲腹機 (腹肌)', sets: 3, reps: '15-20', cue: '握住手柄。胸部向下捲向膝蓋方向。擠壓腹肌。', defaultWeight: 30 },
        ]
      },
      B: {
        name: "訓練 B: 拉 (器械)",
        focus: "背部, 大腿後側, 二頭肌",
        exercises: [
          { id: 'mb1', visual: 'lat_pulldown', name: '高位下拉', sets: 3, reps: '10-12', cue: '寬握。身體微後仰。將橫杆拉至上胸部。', defaultWeight: 40 },
          { id: 'mb2', visual: 'seated_row_machine', name: '坐姿划船', sets: 3, reps: '10-12', cue: '胸部貼緊靠墊。向後拉手柄，夾緊肩胛骨。', defaultWeight: 35 },
          { id: 'mb3', visual: 'leg_curl', name: '坐姿腿彎舉', sets: 3, reps: '12-15', cue: '調整滾輪至腳踝處。雙腿向下/向後彎曲。', defaultWeight: 30 },
          { id: 'mb4', visual: 'back_extension', name: '山羊挺身', sets: 3, reps: '10-12', cue: '保持背部挺直。以髖部為軸向下俯身，然後挺起。', defaultWeight: 0 },
          { id: 'mb5', visual: 'bicep_machine', name: '二頭彎舉器械', sets: 3, reps: '12', cue: '大臂後側貼緊靠墊。向上彎舉手柄。', defaultWeight: 25 },
        ]
      }
    },
    dumbbell: {
      A: {
        name: "訓練 A: 推 (自由重量)",
        focus: "胸部, 肩部, 核心",
        exercises: [
          { id: 'da1', visual: 'goblet_squat', name: '高腳杯深蹲', sets: 3, reps: '10-12', cue: '胸前抱住啞鈴。像坐椅子一樣向後坐。', defaultWeight: 20 },
          { id: 'da2', visual: 'dumbbell_press', name: '啞鈴臥推', sets: 3, reps: '10-12', cue: '平躺。向上推舉啞鈴，緩慢下放至胸側。', defaultWeight: 15 },
          { id: 'da3', visual: 'dumbbell_shoulder_press', name: '坐姿啞鈴推肩', sets: 3, reps: '10-12', cue: '背部挺直。將啞鈴推過頭頂。不要拱背。', defaultWeight: 12 },
          { id: 'da4', visual: 'plank', name: '平板支撐', sets: 3, reps: '30-45s', cue: '身體成一直線。收緊臀部和腹部。', defaultWeight: 0, isTimed: true },
          { id: 'da5', visual: 'push_ups', name: '伏地挺身', sets: 3, reps: '力竭', cue: '胸部貼近地面。保持身體筆直。', defaultWeight: 0 },
        ]
      },
      B: {
        name: "訓練 B: 拉 (自由重量)",
        focus: "背部, 腿後側, 二頭肌",
        exercises: [
          { id: 'db1', visual: 'rdl', name: '羅馬尼亞硬舉 (RDL)', sets: 3, reps: '10-12', cue: '屁股向後推！背部保持平直。感受大腿後側拉伸。', defaultWeight: 20 },
          { id: 'db2', visual: 'dumbbell_row', name: '單臂啞鈴划船', sets: 3, reps: '10-12', cue: '手扶椅凳。將啞鈴拉向臀部方向。夾背。', defaultWeight: 15 },
          { id: 'db3', visual: 'lat_pulldown', name: '高位下拉 (或引體向上)', sets: 3, reps: '10-12', cue: '若無器械可做引體向上。將橫杆拉至上胸。', defaultWeight: 40 },
          { id: 'db4', visual: 'dumbbell_curl', name: '啞鈴二頭彎舉', sets: 3, reps: '12', cue: '大臂夾緊身體。只動前臂，不要甩動身體。', defaultWeight: 10 },
          { id: 'db5', visual: 'back_extension', name: '背部伸展', sets: 3, reps: '10-12', cue: '在羅馬椅或墊子上。下放上半身，再挺起至中立位。', defaultWeight: 0 },
        ]
      }
    }
  }
};

const FOOD_ITEMS_DATA = {
  en: [
    { id: 'f1', name: '3 Eggs + Toast', protein: 18, iconName: 'Sunrise', timingKey: 'morning', desc: 'Start the day' },
    { id: 'f2', name: 'Chicken + Rice', protein: 30, iconName: 'Utensils', timingKey: 'preGym', desc: 'Fuel (Wait 2 hours to digest)' },
    { id: 'f3', name: 'Protein Shake (25g)', protein: 25, iconName: 'Zap', timingKey: 'postGym', desc: 'Repair Muscle (1 Scoop)' },
    { id: 'f4', name: 'Steak / Fish', protein: 30, iconName: 'Sunset', timingKey: 'dinner', desc: 'Growth while sleeping' },
    { id: 'f5', name: 'Greek Yogurt', protein: 15, iconName: 'Moon', timingKey: 'snack', desc: 'Slow release protein' }
  ],
  zh: [
    { id: 'f1', name: '3個雞蛋 + 吐司', protein: 18, iconName: 'Sunrise', timingKey: 'morning', desc: '開啟活力一天' },
    { id: 'f2', name: '雞胸肉 + 米飯', protein: 30, iconName: 'Utensils', timingKey: 'preGym', desc: '能量儲備 (消化需2小時)' },
    { id: 'f3', name: '蛋白粉 (25g)', protein: 25, iconName: 'Zap', timingKey: 'postGym', desc: '肌肉修復 (1勺)' },
    { id: 'f4', name: '牛排 / 魚肉', protein: 30, iconName: 'Sunset', timingKey: 'dinner', desc: '睡眠中生長' },
    { id: 'f5', name: '希臘優格', protein: 15, iconName: 'Moon', timingKey: 'snack', desc: '緩釋蛋白' }
  ]
};

const ICONS = {
  Sunrise, Utensils, Zap, Sunset, Moon, Activity, Battery, AlertTriangle
};

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_workout', icon: '🎯', nameKey: 'firstWorkout', requirement: 1, type: 'workouts' },
  { id: 'streak_5', icon: '🔥', nameKey: 'streak5', requirement: 5, type: 'streak' },
  { id: 'streak_10', icon: '⚡', nameKey: 'streak10', requirement: 10, type: 'streak' },
  { id: 'volume_100', icon: '💪', nameKey: 'volume100', requirement: 100, type: 'volume' },
  { id: 'volume_500', icon: '🏋️', nameKey: 'volume500', requirement: 500, type: 'volume' },
  { id: 'volume_1000', icon: '👑', nameKey: 'volume1000', requirement: 1000, type: 'volume' },
];

// --- VISUAL COMPONENTS (ANIMATED) ---
const Visuals = {
  // WARM UP
  treadmill_walk: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-orange-400 stroke-2 fill-none">
      <style>{`
        .walk-leg-1 { animation: walk1 1s infinite linear; transform-origin: 40px 50px; }
        .walk-leg-2 { animation: walk2 1s infinite linear; transform-origin: 40px 50px; }
        @keyframes walk1 { 0% { transform: rotate(15deg); } 50% { transform: rotate(-15deg); } 100% { transform: rotate(15deg); } }
        @keyframes walk2 { 0% { transform: rotate(-15deg); } 50% { transform: rotate(15deg); } 100% { transform: rotate(-15deg); } }
      `}</style>
      <line x1="10" y1="85" x2="90" y2="85" className="stroke-slate-600 stroke-4" />
      <path d="M40 85 L30 65 L40 50" className="walk-leg-2" />
      <path d="M40 50 L40 25" />
      <circle cx="40" cy="18" r="6" />
      <path d="M40 50 L55 65 L50 85" className="walk-leg-1" />
      <path d="M40 30 L55 45" />
      <path d="M85 30 L80 40" className="stroke-white stroke-1" markerEnd="url(#arrow)" />
    </svg>
  ),
  arm_circles: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-orange-400 stroke-2 fill-none">
      <style>{`
        .arm-spin { animation: spin 2s infinite linear; transform-origin: 50px 45px; }
        @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
      `}</style>
      <line x1="50" y1="80" x2="50" y2="40" />
      <path d="M50 80 L40 95" />
      <path d="M50 80 L60 95" />
      <circle cx="50" cy="30" r="7" />
      <g className="arm-spin">
        <line x1="20" y1="45" x2="80" y2="45" />
        <circle cx="20" cy="45" r="5" className="stroke-white dashed stroke-1" />
        <circle cx="80" cy="45" r="5" className="stroke-white dashed stroke-1" />
      </g>
    </svg>
  ),
  torso_twist: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-orange-400 stroke-2 fill-none">
       <style>{`
        .twist-body { animation: twist 2s infinite ease-in-out; transform-origin: 50px 90px; }
        @keyframes twist { 0% { transform: rotate(-10deg); } 50% { transform: rotate(10deg); } 100% { transform: rotate(-10deg); } }
      `}</style>
       <path d="M40 90 L50 60 L60 90" />
       <g className="twist-body">
         <line x1="50" y1="60" x2="50" y2="30" />
         <line x1="30" y1="40" x2="70" y2="40" />
         <circle cx="50" cy="22" r="6" />
       </g>
       <path d="M30 30 A 20 5 0 0 1 70 30" className="stroke-white stroke-1 dashed opacity-50" />
    </svg>
  ),
  // MACHINES
  leg_press: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .lp-push { animation: lp-move 2s infinite ease-in-out; }
        @keyframes lp-move { 0% { transform: translateX(0); } 50% { transform: translateX(10px); } 100% { transform: translateX(0); } }
      `}</style>
      <path d="M20 70 L40 80" className="stroke-slate-600" />
      <path d="M25 65 L40 75" />
      <circle cx="20" cy="60" r="6" />
      <g className="lp-push">
        <path d="M40 75 L60 65 L80 50" />
        <line x1="75" y1="40" x2="85" y2="60" className="stroke-slate-500 stroke-4" />
        <rect x="85" y="30" width="10" height="40" className="fill-slate-800 stroke-slate-600" />
      </g>
      <path d="M50 50 L65 40" className="stroke-white stroke-1" markerEnd="url(#arrow)" />
    </svg>
  ),
  chest_press_machine: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .cp-arm { animation: cp-move 2s infinite ease-in-out; transform-origin: 35px 45px; }
        @keyframes cp-move { 0% { transform: rotate(0deg); } 50% { transform: rotate(-15deg); } 100% { transform: rotate(0deg); } }
      `}</style>
      <line x1="30" y1="80" x2="30" y2="40" className="stroke-slate-600 stroke-4" />
      <line x1="35" y1="75" x2="35" y2="45" />
      <circle cx="35" cy="38" r="6" />
      <path d="M35 75 L50 80 L50 95" />
      <g className="cp-arm">
        <line x1="35" y1="45" x2="70" y2="45" className="stroke-slate-500" />
        <rect x="65" y="40" width="5" height="10" className="fill-slate-700" />
      </g>
      <path d="M50 40 L70 40" className="stroke-white stroke-1" />
    </svg>
  ),
  shoulder_press_machine: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .sp-arm { animation: sp-move 2s infinite ease-in-out; }
        @keyframes sp-move { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
      `}</style>
      <path d="M30 80 L50 80" className="stroke-slate-600" />
      <line x1="40" y1="80" x2="40" y2="40" className="stroke-slate-600" />
      <line x1="45" y1="75" x2="45" y2="45" />
      <circle cx="45" cy="38" r="6" />
      <g className="sp-arm">
        <path d="M35 45 L35 30 L45 20" />
        <path d="M55 45 L55 30 L45 20" />
        <line x1="25" y1="30" x2="65" y2="30" className="stroke-slate-500 dashed" />
      </g>
      <path d="M60 40 L60 20" className="stroke-white stroke-1" />
    </svg>
  ),
  tricep_pushdown: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
       <style>{`
        .tp-arm { animation: tp-move 2s infinite ease-in-out; transform-origin: 30px 45px; }
        @keyframes tp-move { 0% { transform: rotate(0deg); } 50% { transform: rotate(20deg); } 100% { transform: rotate(0deg); } }
       `}</style>
       <line x1="40" y1="10" x2="80" y2="10" className="stroke-slate-600" />
       <line x1="60" y1="10" x2="60" y2="40" className="stroke-slate-500" />
       <line x1="30" y1="90" x2="30" y2="40" />
       <circle cx="30" cy="32" r="6" />
       <g className="tp-arm">
         <path d="M30 45 L45 55 L45 70" />
         <line x1="45" y1="70" x2="60" y2="40" className="stroke-emerald-200" />
       </g>
       <path d="M55 55 L55 75" className="stroke-white stroke-1" />
    </svg>
  ),
  ab_crunch_machine: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
       <style>{`
        .ab-crunch { animation: ab-move 2s infinite ease-in-out; transform-origin: 40px 80px; }
        @keyframes ab-move { 0% { transform: rotate(0deg); } 50% { transform: rotate(15deg); } 100% { transform: rotate(0deg); } }
       `}</style>
       <path d="M30 80 L50 80" className="stroke-slate-600" />
       <line x1="40" y1="80" x2="40" y2="40" className="stroke-slate-600" />
       <g className="ab-crunch">
         <path d="M40 80 L50 50" />
         <circle cx="50" cy="42" r="6" />
         <path d="M50 50 L65 45" />
         <line x1="60" y1="30" x2="60" y2="50" className="stroke-slate-500 dashed" />
       </g>
       <path d="M70 40 A 10 10 0 0 1 70 60" className="stroke-white stroke-1" />
    </svg>
  ),
  lat_pulldown: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .lat-arms { animation: lat-move 2s infinite ease-in-out; transform-origin: 50px 60px; }
        @keyframes lat-move { 0% { transform: scaleY(1); } 50% { transform: scaleY(0.7); } 100% { transform: scaleY(1); } }
      `}</style>
      <path d="M40 90 L60 90" className="stroke-slate-600" />
      <line x1="50" y1="90" x2="50" y2="60" />
      <circle cx="50" cy="52" r="7" />
      <g className="lat-arms">
        <path d="M50 60 L30 40 L30 20" />
        <path d="M50 60 L70 40 L70 20" />
        <line x1="10" y1="20" x2="90" y2="20" className="stroke-emerald-200 stroke-4" />
      </g>
      <path d="M80 25 L80 50" className="stroke-white stroke-1" />
    </svg>
  ),
  seated_row_machine: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .row-arms { animation: row-move 2s infinite ease-in-out; }
        @keyframes row-move { 0% { transform: translateX(0); } 50% { transform: translateX(-5px); } 100% { transform: translateX(0); } }
      `}</style>
      <path d="M20 80 L30 80" className="stroke-slate-600" />
      <line x1="25" y1="80" x2="25" y2="45" />
      <circle cx="25" cy="38" r="6" />
      <path d="M25 80 L40 85 L60 85" />
      <rect x="30" y="50" width="5" height="20" className="fill-slate-700" />
      <g className="row-arms">
        <line x1="25" y1="50" x2="50" y2="50" />
        <path d="M45 40 L30 40" className="stroke-white stroke-1" />
      </g>
    </svg>
  ),
  leg_curl: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .lc-leg { animation: lc-move 2s infinite ease-in-out; transform-origin: 60px 60px; }
        @keyframes lc-move { 0% { transform: rotate(0deg); } 50% { transform: rotate(30deg); } 100% { transform: rotate(0deg); } }
      `}</style>
      <path d="M20 60 L50 60 L50 90" className="stroke-slate-600" />
      <path d="M30 60 L30 30" />
      <circle cx="30" cy="22" r="6" />
      <path d="M30 60 L60 60" /> 
      <g className="lc-leg">
        <path d="M60 60 L60 85" className="stroke-emerald-300" /> 
        <circle cx="60" cy="80" r="4" className="fill-slate-700" />
      </g>
      <path d="M70 80 A 10 10 0 0 1 50 80" className="stroke-white stroke-1" />
    </svg>
  ),
  back_extension: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .be-body { animation: be-move 2s infinite ease-in-out; transform-origin: 40px 60px; }
        @keyframes be-move { 0% { transform: rotate(0deg); } 50% { transform: rotate(20deg); } 100% { transform: rotate(0deg); } }
      `}</style>
      <path d="M30 90 L40 60" className="stroke-slate-600 stroke-4" />
      <line x1="20" y1="80" x2="40" y2="60" />
      <g className="be-body">
        <line x1="40" y1="60" x2="70" y2="60" />
        <circle cx="75" cy="60" r="6" />
      </g>
      <path d="M80 60 A 10 10 0 0 0 70 40" className="stroke-white stroke-1" />
    </svg>
  ),
  bicep_machine: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
       <style>{`
        .bm-arm { animation: bm-move 2s infinite ease-in-out; transform-origin: 55px 40px; }
        @keyframes bm-move { 0% { transform: rotate(0deg); } 50% { transform: rotate(-30deg); } 100% { transform: rotate(0deg); } }
       `}</style>
       <path d="M50 90 L40 50" className="stroke-slate-600 stroke-4" />
       <path d="M30 60 L45 55 L55 40" />
       <g className="bm-arm">
         <line x1="55" y1="40" x2="70" y2="30" className="stroke-emerald-200" />
       </g>
       <path d="M60 30 A 10 10 0 0 0 50 50" className="stroke-white stroke-1" />
    </svg>
  ),

  // DUMBBELL / FREE WEIGHTS (Emerald Theme)
  goblet_squat: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .gs-body { animation: gs-squat 2s infinite ease-in-out; transform-origin: 50px 90px; }
        @keyframes gs-squat { 0% { transform: scaleY(1); } 50% { transform: scaleY(0.7); } 100% { transform: scaleY(1); } }
      `}</style>
      <circle cx="50" cy="25" r="8" />
      <g className="gs-body">
        <line x1="50" y1="33" x2="50" y2="60" />
        <path d="M50 60 L30 85 L30 95" />
        <path d="M50 60 L70 85 L70 95" />
        <path d="M50 40 L35 50 L50 50" />
        <path d="M50 40 L65 50 L50 50" />
        <rect x="45" y="45" width="10" height="10" className="fill-emerald-500/20 stroke-emerald-200" />
      </g>
      <path d="M85 50 L85 80" className="stroke-white stroke-1" markerEnd="url(#arrow)" />
    </svg>
  ),
  dumbbell_press: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .dp-arm { animation: dp-press 2s infinite ease-in-out; }
        @keyframes dp-press { 0% { transform: translateY(0); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0); } }
      `}</style>
      <line x1="20" y1="70" x2="80" y2="70" className="stroke-slate-600 stroke-4" />
      <line x1="25" y1="65" x2="75" y2="65" />
      <circle cx="25" cy="60" r="6" />
      <g className="dp-arm">
        <line x1="35" y1="65" x2="35" y2="40" />
        <line x1="35" y1="40" x2="50" y2="30" />
        <rect x="45" y="25" width="10" height="5" className="fill-emerald-500/20 stroke-emerald-200" />
      </g>
      <path d="M60 55 L60 30" className="stroke-white stroke-1" />
    </svg>
  ),
  dumbbell_row: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
       <style>{`
        .dr-arm { animation: dr-pull 2s infinite ease-in-out; }
        @keyframes dr-pull { 0% { transform: translateY(0); } 50% { transform: translateY(-10px); } 100% { transform: translateY(0); } }
       `}</style>
       <path d="M20 80 L30 80 L30 60" className="stroke-slate-600" />
       <line x1="35" y1="60" x2="35" y2="35" />
       <path d="M35 60 L50 65 L50 80" />
       <circle cx="35" cy="28" r="6" />
       <g className="dr-arm">
         <line x1="35" y1="40" x2="55" y2="50" />
         <rect x="52" y="48" width="10" height="5" className="fill-emerald-500/20 stroke-emerald-200" />
       </g>
       <path d="M70 40 L50 40" className="stroke-white stroke-1" />
    </svg>
  ),
  dumbbell_shoulder_press: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .dsp-arm { animation: dsp-press 2s infinite ease-in-out; }
        @keyframes dsp-press { 0% { transform: translateY(0); } 50% { transform: translateY(-15px); } 100% { transform: translateY(0); } }
      `}</style>
      <line x1="40" y1="80" x2="40" y2="40" className="stroke-slate-600" />
      <line x1="50" y1="80" x2="50" y2="40" />
      <circle cx="50" cy="32" r="7" />
      <g className="dsp-arm">
        <path d="M50 45 L30 30 L30 15" />
        <path d="M50 45 L70 30 L70 15" />
        <rect x="25" y="10" width="10" height="5" className="fill-emerald-500/20 stroke-emerald-200" />
        <rect x="65" y="10" width="10" height="5" className="fill-emerald-500/20 stroke-emerald-200" />
      </g>
      <path d="M85 40 L85 15" className="stroke-white stroke-1" />
    </svg>
  ),
  plank: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <line x1="10" y1="80" x2="90" y2="80" className="stroke-slate-600 stroke-1" />
      <line x1="20" y1="75" x2="80" y2="65" className="stroke-4" />
      <line x1="80" y1="65" x2="80" y2="80" />
      <circle cx="85" cy="62" r="5" />
    </svg>
  ),
  rdl: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
       <style>{`
        .rdl-body { animation: rdl-hinge 2s infinite ease-in-out; transform-origin: 40px 60px; }
        @keyframes rdl-hinge { 0% { transform: rotate(0deg); } 50% { transform: rotate(30deg); } 100% { transform: rotate(0deg); } }
       `}</style>
       <path d="M40 90 L45 60 L30 50" className="rdl-legs" />
       <g className="rdl-body">
         <line x1="45" y1="60" x2="45" y2="30" />
         <circle cx="45" cy="22" r="6" />
         <line x1="45" y1="40" x2="45" y2="65" />
         <circle cx="45" cy="70" r="5" className="fill-emerald-500/20 stroke-emerald-200" />
       </g>
       <path d="M70 30 L85 30" className="stroke-white stroke-1" />
    </svg>
  ),
  push_ups: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
       <style>{`
        .pu-body { animation: pu-move 2s infinite ease-in-out; transform-origin: 20px 80px; }
        @keyframes pu-move { 0% { transform: rotate(0deg); } 50% { transform: rotate(-10deg); } 100% { transform: rotate(0deg); } }
       `}</style>
       <line x1="10" y1="85" x2="90" y2="85" className="stroke-slate-600 stroke-1" />
       <g className="pu-body">
         <line x1="20" y1="80" x2="70" y2="60" />
         <circle cx="75" cy="55" r="5" />
         <line x1="65" y1="62" x2="65" y2="85" />
       </g>
       <path d="M40 50 L40 70" className="stroke-white stroke-1" />
    </svg>
  ),
  dumbbell_curl: () => (
    <svg viewBox="0 0 100 100" className="w-full h-full stroke-emerald-400 stroke-2 fill-none">
      <style>{`
        .dc-arm { animation: dc-curl 2s infinite ease-in-out; transform-origin: 50px 45px; }
        @keyframes dc-curl { 0% { transform: rotate(0deg); } 50% { transform: rotate(-80deg); } 100% { transform: rotate(0deg); } }
      `}</style>
      <line x1="50" y1="90" x2="50" y2="40" />
      <circle cx="50" cy="30" r="7" />
      <g className="dc-arm">
        <path d="M50 45 L50 65 L50 75" />
        <circle cx="50" cy="80" r="5" className="fill-emerald-500/20 stroke-emerald-200" />
      </g>
      <path d="M80 65 A 10 10 0 0 1 80 45" className="stroke-white stroke-1" />
    </svg>
  ),
};

// --- HELPER FUNCTIONS ---

const calculateLevel = (xp) => {
  const level = Math.floor(xp / 100) + 1;
  const xpInCurrentLevel = xp % 100;
  const xpToNextLevel = 100 - xpInCurrentLevel;
  return { level, xpInCurrentLevel, xpToNextLevel, totalXp: xp };
};

const calculateStreak = (history) => {
  if (!history || history.length === 0) return 0;
  
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let streak = 0;
  let checkDate = new Date(today);
  
  // Sort history by date (newest first)
  const sortedHistory = [...history].sort((a, b) => new Date(b.completedAt) - new Date(a.completedAt));
  
  for (let i = 0; i < sortedHistory.length; i++) {
    const workoutDate = new Date(sortedHistory[i].completedAt);
    workoutDate.setHours(0, 0, 0, 0);
    
    const diffDays = Math.floor((checkDate - workoutDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0 || diffDays === 1) {
      streak++;
      checkDate = new Date(workoutDate);
      checkDate.setDate(checkDate.getDate() - 1);
    } else {
      break;
    }
  }
  
  return streak;
};

const getTotalVolume = (history, exerciseData) => {
  let totalVolume = 0;
  history.forEach(workout => {
    if (workout.exerciseData) {
      Object.values(workout.exerciseData).forEach(data => {
        if (data && data.sets) {
          data.sets.forEach(set => {
            totalVolume += (set.weight || 0) * (set.reps || 0);
          });
        }
      });
    }
  });
  return totalVolume;
};

// Get weekly stats
const getWeeklyStats = (history) => {
  const now = new Date();
  const thisWeekStart = new Date(now);
  thisWeekStart.setDate(now.getDate() - now.getDay());
  thisWeekStart.setHours(0, 0, 0, 0);
  
  const lastWeekStart = new Date(thisWeekStart);
  lastWeekStart.setDate(lastWeekStart.getDate() - 7);
  
  const thisWeekWorkouts = history.filter(w => new Date(w.completedAt) >= thisWeekStart);
  const lastWeekWorkouts = history.filter(w => {
    const date = new Date(w.completedAt);
    return date >= lastWeekStart && date < thisWeekStart;
  });
  
  const thisWeekVolume = thisWeekWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
  const lastWeekVolume = lastWeekWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0);
  
  // Find best day
  const dayVolumes = {};
  thisWeekWorkouts.forEach(w => {
    const day = new Date(w.completedAt).toLocaleDateString('en-US', { weekday: 'short' });
    dayVolumes[day] = (dayVolumes[day] || 0) + (w.totalVolume || 0);
  });
  
  const bestDay = Object.entries(dayVolumes).sort((a, b) => b[1] - a[1])[0];
  
  return {
    thisWeek: {
      workouts: thisWeekWorkouts.length,
      volume: thisWeekVolume
    },
    lastWeek: {
      workouts: lastWeekWorkouts.length,
      volume: lastWeekVolume
    },
    improvement: lastWeekVolume > 0 ? Math.round(((thisWeekVolume - lastWeekVolume) / lastWeekVolume) * 100) : 0,
    bestDay: bestDay ? bestDay[0] : '-'
  };
};

// --- COMPONENTS ---

const LoadingScreen = ({ t }) => (
  <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center text-white">
    <Dumbbell className="w-12 h-12 text-emerald-500 animate-bounce mb-4" />
    <h2 className="text-xl font-bold">{t?.loading || "Loading..."}</h2>
  </div>
);

// Auth Screen with Google Sign In and Local Data Detection
const AuthScreen = ({ onLogin, isCheckingLocalData }) => {
  const [hasLocalData, setHasLocalData] = useState(false);
  
  useEffect(() => {
    // Check if user has existing local data
    const localData = checkForLocalData();
    setHasLocalData(!!localData && Object.keys(localData).length > 0);
  }, []);
  
  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-slate-900 p-8 rounded-2xl border border-slate-800 shadow-xl max-w-sm w-full">
        <div className="bg-emerald-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
          <Trophy className="w-8 h-8 text-emerald-500" />
        </div>
        <h1 className="text-3xl font-bold text-white mb-2">IronStart</h1>
        <p className="text-slate-400 mb-8">Cloud-Enabled Edition</p>
        
        {hasLocalData && (
          <div className="bg-amber-900/20 border border-amber-500/30 rounded-lg p-3 mb-6">
            <div className="flex items-center gap-2 text-amber-400">
              <HardDrive className="w-4 h-4" />
              <span className="text-xs">Local data detected</span>
            </div>
          </div>
        )}
        
        <button 
          onClick={onLogin}
          disabled={isCheckingLocalData}
          className="w-full bg-emerald-500 hover:bg-emerald-600 disabled:opacity-50 text-white font-bold py-4 rounded-xl transition-all flex items-center justify-center gap-2 mb-3"
        >
          <Cloud className="w-5 h-5" />
          Sign in with Google
        </button>
        
        <button 
          onClick={() => onLogin(true)}
          disabled={isCheckingLocalData}
          className="w-full bg-slate-800 hover:bg-slate-700 disabled:opacity-50 text-slate-400 font-bold py-3 rounded-xl transition-all text-sm"
        >
          Continue Offline (Local Only)
        </button>
      </div>
    </div>
  );
};

// Exercise Timer Component (for timed exercises like planks)
const ExerciseTimer = ({ duration = 45, onComplete, t }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return mins > 0 ? `${mins}:${secs.toString().padStart(2, '0')}` : `${secs}s`;
  };

  const handleStart = () => {
    if (isComplete) {
      setTimeLeft(duration);
      setIsComplete(false);
    }
    setIsRunning(true);
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className={`p-3 rounded-lg border ${isComplete ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-800 border-slate-700'}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <Clock className={`w-4 h-4 ${isComplete ? 'text-emerald-400' : 'text-orange-400'}`} />
          <span className="text-sm font-bold text-white">{t.exerciseTimer}</span>
        </div>
        {isComplete && (
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
        )}
      </div>
      
      <div className="relative h-2 bg-slate-700 rounded-full overflow-hidden mb-2">
        <div 
          className={`h-full transition-all duration-1000 ${isComplete ? 'bg-emerald-500' : 'bg-orange-500'}`}
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <div className="flex items-center justify-between">
        <span className={`text-lg font-bold ${isComplete ? 'text-emerald-400' : 'text-white'}`}>
          {formatTime(timeLeft)}
        </span>
        <div className="flex gap-2">
          {!isRunning && !isComplete && (
            <button 
              onClick={handleStart}
              className="bg-orange-500 hover:bg-orange-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
            >
              <Play className="w-3 h-3" /> {t.startTimer}
            </button>
          )}
          {isRunning && (
            <button 
              onClick={() => setIsRunning(false)}
              className="bg-slate-700 hover:bg-slate-600 text-white px-3 py-1 rounded text-xs font-bold flex items-center gap-1"
            >
              <Pause className="w-3 h-3" /> {t.pauseTimer}
            </button>
          )}
          {isComplete && onComplete && (
            <button 
              onClick={onComplete}
              className="bg-emerald-500 hover:bg-emerald-600 text-white px-3 py-1 rounded text-xs font-bold"
            >
              Done
            </button>
          )}
          <button 
            onClick={() => { setTimeLeft(duration); setIsComplete(false); setIsRunning(false); }}
            className="bg-slate-700 hover:bg-slate-600 text-slate-400 px-2 py-1 rounded text-xs"
          >
            <RotateCcw className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};

// Rest Timer Component
const RestTimer = ({ duration = 90, onComplete, t }) => {
  const [timeLeft, setTimeLeft] = useState(duration);
  const [isRunning, setIsRunning] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            setIsRunning(false);
            setIsComplete(true);
            // Vibrate if supported
            if (navigator.vibrate) {
              navigator.vibrate([200, 100, 200]);
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(intervalRef.current);
  }, [isRunning]);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStart = () => {
    if (isComplete) {
      setTimeLeft(duration);
      setIsComplete(false);
    }
    setIsRunning(true);
  };

  const handlePause = () => {
    setIsRunning(false);
  };

  const handleSkip = () => {
    setIsRunning(false);
    setTimeLeft(0);
    setIsComplete(true);
    if (onComplete) onComplete();
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  return (
    <div className={`p-4 rounded-xl border ${isComplete ? 'bg-emerald-900/30 border-emerald-500/50' : 'bg-slate-900 border-slate-800'}`}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Timer className={`w-5 h-5 ${isComplete ? 'text-emerald-400' : 'text-orange-400'}`} />
          <span className="font-bold text-white">{t.restTimer}</span>
        </div>
        {isComplete && (
          <span className="text-emerald-400 text-sm font-bold animate-pulse">{t.restComplete}</span>
        )}
      </div>
      
      <div className="relative w-32 h-32 mx-auto mb-4">
        <svg className="w-full h-full -rotate-90">
          <circle cx="64" cy="64" r="56" className="stroke-slate-800 stroke-8 fill-none" />
          <circle 
            cx="64" cy="64" r="56" 
            className={`stroke-8 fill-none transition-all duration-1000 ${isComplete ? 'stroke-emerald-500' : 'stroke-orange-500'}`}
            strokeDasharray="352"
            strokeDashoffset={352 - (352 * progress / 100)}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className={`text-3xl font-bold ${isComplete ? 'text-emerald-400' : 'text-white'}`}>
            {formatTime(timeLeft)}
          </span>
        </div>
      </div>

      <div className="flex gap-2 justify-center">
        {!isRunning && !isComplete && (
          <button 
            onClick={handleStart}
            className="bg-orange-500 hover:bg-orange-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Play className="w-4 h-4" /> {t.tapToStart}
          </button>
        )}
        {isRunning && (
          <button 
            onClick={handlePause}
            className="bg-slate-700 hover:bg-slate-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2"
          >
            <Pause className="w-4 h-4" /> Pause
          </button>
        )}
        {isComplete && (
          <button 
            onClick={onComplete}
            className="bg-emerald-500 hover:bg-emerald-600 text-white px-6 py-2 rounded-lg font-bold"
          >
            Continue
          </button>
        )}
        {isRunning && (
          <button 
            onClick={handleSkip}
            className="bg-slate-800 hover:bg-slate-700 text-slate-400 px-4 py-2 rounded-lg text-sm"
          >
            {t.skipRest}
          </button>
        )}
      </div>
    </div>
  );
};

// Warmup Card Component
const WarmupCard = ({ exercise, onComplete, isCompleted }) => {
  const VisualComponent = Visuals[exercise.visual];
  return (
    <div className={`p-4 mb-4 rounded-xl border transition-all ${isCompleted ? 'bg-orange-900/20 border-orange-500/50' : 'bg-slate-900 border-slate-800'}`}>
      <div className="flex gap-4">
        <div className="w-20 h-20 bg-slate-950 rounded-lg border border-slate-700 flex-shrink-0 p-2 flex items-center justify-center overflow-hidden">
          {VisualComponent ? <VisualComponent /> : <Activity className="text-orange-500" />}
        </div>
        <div className="flex-1 flex flex-col justify-center">
           <h3 className={`font-bold ${isCompleted ? 'text-orange-400' : 'text-white'}`}>{exercise.name}</h3>
           <p className="text-slate-400 text-xs mb-1">{exercise.duration}</p>
           <p className="text-slate-500 text-[10px] italic">{exercise.cue}</p>
        </div>
        <button onClick={() => onComplete(exercise.id)} className={`h-12 w-12 self-center rounded-full border-2 flex items-center justify-center transition-all ${isCompleted ? 'bg-orange-500 border-orange-500 text-white' : 'border-slate-600 text-slate-600'}`}>
          {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Play className="w-5 h-5 ml-1" />}
        </button>
      </div>
    </div>
  );
};

// Enhanced Exercise Card with Weight/Rep Tracking and Timer
const ExerciseCard = ({ exercise, onComplete, isCompleted, exerciseData, onUpdateData, t }) => {
  const [showCue, setShowCue] = useState(true);
  const [showWeightInputs, setShowWeightInputs] = useState(true); // Expanded by default
  const VisualComponent = Visuals[exercise.visual];

  const currentSets = exerciseData?.sets || Array(exercise.sets).fill(null).map(() => ({ weight: exercise.defaultWeight || 0, reps: parseInt(exercise.reps) || 10 }));
  const completedSets = currentSets.filter(s => s.completed).length;
  const isFullyCompleted = completedSets >= exercise.sets;
  const isTimed = exercise.isTimed;

  const updateSet = (setIndex, field, value) => {
    const newSets = [...currentSets];
    newSets[setIndex] = { ...newSets[setIndex], [field]: value };
    onUpdateData(exercise.id, { sets: newSets });
  };

  const toggleSetComplete = (setIndex) => {
    const newSets = [...currentSets];
    newSets[setIndex] = { ...newSets[setIndex], completed: !newSets[setIndex].completed };
    onUpdateData(exercise.id, { sets: newSets });
  };

  // Parse duration from reps string (e.g., "30-45s" -> 45)
  const parseDuration = (repsStr) => {
    const match = repsStr.match(/(\d+)-?(\d+)?s/);
    if (match) {
      return parseInt(match[2] || match[1]);
    }
    return 45; // default
  };

  return (
    <div className={`p-4 mb-4 rounded-xl border transition-all ${isFullyCompleted ? 'bg-slate-900/50 border-emerald-500/30' : 'bg-slate-800 border-slate-700'}`}>
      <div className="flex gap-4 mb-3">
        <div className="w-20 h-20 bg-slate-900 rounded-lg border border-slate-700 flex-shrink-0 p-2 flex items-center justify-center overflow-hidden">
          {VisualComponent ? <VisualComponent /> : <Dumbbell className="text-slate-600" />}
        </div>
        <div className="flex-1">
          <div className="flex justify-between items-start mb-2">
            <div>
              <h3 className={`font-bold text-lg leading-tight ${isFullyCompleted ? 'text-emerald-400' : 'text-white'}`}>{exercise.name}</h3>
              <p className="text-sm text-slate-400 mt-1">{exercise.sets} {t.sets} × {exercise.reps} {isTimed ? t.seconds : t.reps}</p>
            </div>
            <button 
              onClick={() => onComplete(exercise.id)} 
              className={`p-2 rounded-full transition-all flex-shrink-0 ${isFullyCompleted ? 'bg-emerald-500 text-white' : 'bg-slate-700 text-slate-400 hover:bg-slate-600'}`}
            >
              <CheckCircle2 className="w-6 h-6" />
            </button>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowCue(!showCue)} className="text-xs flex items-center gap-1 text-slate-500 hover:text-emerald-400 transition-colors">
              <Eye className="w-3 h-3" /> {showCue ? 'Hide' : 'Show How-To'}
            </button>
          </div>
        </div>
      </div>

      {/* Timer for timed exercises */}
      {isTimed && (
        <div className="mb-3">
          <ExerciseTimer duration={parseDuration(exercise.reps)} t={t} />
        </div>
      )}

      {/* Weight/Rep Input per Set - Expanded by default for clarity */}
      {!isTimed && (
        <div className="bg-slate-900/50 p-3 rounded-lg border border-slate-700 mb-3">
          <div className="flex items-center justify-between mb-2 cursor-pointer" onClick={() => setShowWeightInputs(!showWeightInputs)}>
            <div className="grid grid-cols-3 gap-2 text-xs text-slate-400">
              <span>{t.sets}</span>
              <span>{t.weight} ({t.kg})</span>
              <span>{t.reps}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500">
                {completedSets}/{exercise.sets} {t.sets} done
              </span>
              <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform ${showWeightInputs ? 'rotate-180' : ''}`} />
            </div>
          </div>
          
          <AnimatePresence>
            {showWeightInputs && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="overflow-hidden"
              >
              {currentSets.map((set, idx) => (
                <div key={idx} className="grid grid-cols-3 gap-2 mb-2 items-center">
              <div className="flex items-center gap-2">
                <button 
                  onClick={() => toggleSetComplete(idx)}
                  className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${set.completed ? 'bg-emerald-500 border-emerald-500' : 'border-slate-600'}`}
                >
                  {set.completed && <CheckCircle2 className="w-4 h-4 text-white" />}
                </button>
                <span className="text-sm text-white">#{idx + 1}</span>
              </div>
              <input 
                type="number" 
                value={set.weight || 0}
                onChange={(e) => updateSet(idx, 'weight', parseInt(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm w-full focus:border-emerald-500 focus:outline-none"
              />
              <input 
                type="number" 
                value={set.reps || 0}
                onChange={(e) => updateSet(idx, 'reps', parseInt(e.target.value) || 0)}
                className="bg-slate-800 border border-slate-600 rounded px-2 py-1 text-white text-sm w-full focus:border-emerald-500 focus:outline-none"
              />
            </div>
              ))}
              {completedSets < exercise.sets && (
                <div className="mt-2 p-2 bg-orange-900/20 border border-orange-500/30 rounded text-xs text-orange-300 flex items-center gap-2">
                  <AlertTriangle className="w-3 h-3" />
                  <span>Complete all {exercise.sets - completedSets} remaining set{exercise.sets - completedSets > 1 ? 's' : ''} to finish this exercise</span>
                </div>
              )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {showCue && (
        <div className="mt-3 p-3 bg-slate-900/80 rounded-lg text-sm text-emerald-200 border-l-2 border-emerald-500 animate-in slide-in-from-top-2">
          <span className="font-bold block mb-1">How to do it:</span>
          {exercise.cue}
        </div>
      )}
    </div>
  );
};

// Goals View Component
const GoalsView = ({ goals, onSave, t }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    targetWeight: '',
    weeklyWorkouts: 3,
    dailyProtein: 120,
    streakGoal: 7,
    deadline: ''
  });

  const handleSave = () => {
    const newGoal = {
      id: crypto.randomUUID(),
      createdAt: new Date().toISOString(),
      ...formData
    };
    onSave(newGoal);
    setShowForm(false);
  };

  return (
    <div className="pb-24">
      <div className="p-6 bg-slate-900 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-500" />
          {t.goals}
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {goals && !showForm ? (
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="flex justify-between items-start mb-4">
              <h3 className="font-bold text-white">{t.currentGoal}</h3>
              <button 
                onClick={() => setShowForm(true)}
                className="text-emerald-400 text-sm flex items-center gap-1"
              >
                <Edit className="w-4 h-4" /> Edit
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              {goals.targetWeight && (
                <div className="bg-slate-800 p-3 rounded-lg">
                  <div className="text-xs text-slate-400">{t.goalWeight}</div>
                  <div className="text-xl font-bold text-white">{goals.targetWeight} kg</div>
                </div>
              )}
              <div className="bg-slate-800 p-3 rounded-lg">
                <div className="text-xs text-slate-400">{t.goalWorkouts}</div>
                <div className="text-xl font-bold text-white">{goals.weeklyWorkouts}/week</div>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg">
                <div className="text-xs text-slate-400">{t.goalProtein}</div>
                <div className="text-xl font-bold text-white">{goals.dailyProtein}g/day</div>
              </div>
              <div className="bg-slate-800 p-3 rounded-lg">
                <div className="text-xs text-slate-400">{t.goalStreak}</div>
                <div className="text-xl font-bold text-white">{goals.streakGoal} days</div>
              </div>
            </div>

            {goals.deadline && (
              <div className="mt-4 p-3 bg-emerald-900/30 rounded-lg border border-emerald-500/30">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-emerald-400" />
                  <span className="text-sm text-emerald-400">
                    {Math.max(0, Math.ceil((new Date(goals.deadline) - new Date()) / (1000 * 60 * 60 * 24)))} {t.daysLeft}
                  </span>
                </div>
              </div>
            )}
          </div>
        ) : !showForm ? (
          <button 
            onClick={() => setShowForm(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> {t.setGoal}
          </button>
        ) : (
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-white mb-4">{t.setGoal}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-slate-400">{t.goalWeight} ({t.kg})</label>
                <input 
                  type="number" 
                  value={formData.targetWeight}
                  onChange={(e) => setFormData({...formData, targetWeight: e.target.value})}
                  placeholder="65"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t.goalWorkouts}</label>
                <input 
                  type="number" 
                  value={formData.weeklyWorkouts}
                  onChange={(e) => setFormData({...formData, weeklyWorkouts: parseInt(e.target.value) || 3})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t.goalProtein} ({t.kg})</label>
                <input 
                  type="number" 
                  value={formData.dailyProtein}
                  onChange={(e) => setFormData({...formData, dailyProtein: parseInt(e.target.value) || 120})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t.goalStreak} (days)</label>
                <input 
                  type="number" 
                  value={formData.streakGoal}
                  onChange={(e) => setFormData({...formData, streakGoal: parseInt(e.target.value) || 7})}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={handleSave}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
                >
                  <Save className="w-4 h-4" /> {t.saveWorkout}
                </button>
                <button 
                  onClick={() => setShowForm(false)}
                  className="bg-slate-800 text-slate-400 px-4 py-2 rounded-lg hover:text-white"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Progress View Component
const ProgressView = ({ history, metrics, t }) => {
  const weeklyStats = getWeeklyStats(history);
  const totalVolume = getTotalVolume(history, {});
  const totalWorkouts = history.length;

  // Get last 7 days of workouts for chart
  const last7Days = [...Array(7)].map((_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dateStr = date.toDateString();
    const dayWorkouts = history.filter(w => new Date(w.completedAt).toDateString() === dateStr);
    return {
      day: date.toLocaleDateString('en-US', { weekday: 'short' }),
      workouts: dayWorkouts.length,
      volume: dayWorkouts.reduce((sum, w) => sum + (w.totalVolume || 0), 0)
    };
  });

  const maxVolume = Math.max(...last7Days.map(d => d.volume), 1);

  return (
    <div className="pb-24">
      <div className="p-6 bg-slate-900 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <BarChart3 className="w-5 h-5 text-emerald-500" />
          {t.progress}
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {/* Weekly Summary */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h3 className="font-bold text-white mb-4">{t.weeklySummary}</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-4">
            <div className="bg-slate-800 p-3 rounded-lg">
              <div className="text-xs text-slate-400">{t.thisWeek}</div>
              <div className="text-2xl font-bold text-emerald-400">{weeklyStats.thisWeek.workouts}</div>
              <div className="text-xs text-slate-500">{t.totalWorkouts}</div>
            </div>
            <div className="bg-slate-800 p-3 rounded-lg">
              <div className="text-xs text-slate-400">{t.avgVolume}</div>
              <div className="text-2xl font-bold text-blue-400">
                {weeklyStats.thisWeek.workouts > 0 
                  ? Math.round(weeklyStats.thisWeek.volume / weeklyStats.thisWeek.workouts)
                  : 0}
              </div>
              <div className="text-xs text-slate-500">{t.kg}</div>
            </div>
          </div>

          {weeklyStats.improvement !== 0 && (
            <div className={`p-3 rounded-lg flex items-center gap-2 ${weeklyStats.improvement > 0 ? 'bg-emerald-900/30' : 'bg-red-900/30'}`}>
              {weeklyStats.improvement > 0 ? (
                <TrendingUp className="w-5 h-5 text-emerald-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
              <span className={weeklyStats.improvement > 0 ? 'text-emerald-400' : 'text-red-400'}>
                {Math.abs(weeklyStats.improvement)}% {t.improvement} vs {t.lastWeek}
              </span>
            </div>
          )}
        </div>

        {/* Weekly Chart */}
        <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
          <h3 className="font-bold text-white mb-4">{t.thisWeek}</h3>
          
          <div className="flex items-end gap-2 h-32">
            {last7Days.map((day, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center">
                <div className="w-full flex flex-col items-center">
                  {day.workouts > 0 && (
                    <span className="text-xs text-emerald-400 mb-1">{day.workouts}</span>
                  )}
                  <div 
                    className={`w-full rounded-t transition-all ${day.volume > 0 ? 'bg-emerald-500' : 'bg-slate-700'}`}
                    style={{ height: `${Math.max((day.volume / maxVolume) * 80, 4)}px` }}
                  />
                </div>
                <span className="text-[10px] text-slate-500 mt-1">{day.day}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Stats Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <Dumbbell className="w-6 h-6 text-emerald-500 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalWorkouts}</div>
            <div className="text-xs text-slate-400">{t.totalWorkouts}</div>
          </div>
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 text-center">
            <BarChart3 className="w-6 h-6 text-blue-400 mx-auto mb-2" />
            <div className="text-2xl font-bold text-white">{totalVolume.toLocaleString()}</div>
            <div className="text-xs text-slate-400">{t.totalVolume} ({t.kg})</div>
          </div>
        </div>

        {weeklyStats.bestDay && weeklyStats.bestDay !== '-' && (
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <div className="flex items-center gap-3">
              <Award className="w-8 h-8 text-yellow-500" />
              <div>
                <div className="text-sm text-slate-400">{t.bestDay}</div>
                <div className="font-bold text-white text-lg">{weeklyStats.bestDay}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Body Metrics Component
const MetricsView = ({ metrics, onSave, t }) => {
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    weight: '',
    bodyFat: '',
    chest: '',
    arms: '',
    waist: '',
    thighs: ''
  });

  const handleSave = () => {
    const newMetric = {
      id: crypto.randomUUID(),
      date: new Date().toISOString(),
      ...formData
    };
    onSave(newMetric);
    setShowForm(false);
    setFormData({ weight: '', bodyFat: '', chest: '', arms: '', waist: '', thighs: '' });
  };

  const latestMetric = metrics[0];
  const previousMetric = metrics[1];

  const getTrend = (current, previous, key) => {
    if (!current || !previous || !current[key] || !previous[key]) return null;
    const diff = parseFloat(current[key]) - parseFloat(previous[key]);
    if (diff > 0) return { direction: 'up', value: diff.toFixed(1) };
    if (diff < 0) return { direction: 'down', value: Math.abs(diff).toFixed(1) };
    return { direction: 'same', value: 0 };
  };

  return (
    <div className="pb-24">
      <div className="p-6 bg-slate-900 border-b border-slate-800">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <TrendingUp className="w-5 h-5 text-emerald-500" />
          {t.metrics}
        </h2>
      </div>

      <div className="p-4 space-y-4">
        {latestMetric && (
          <div className="grid grid-cols-2 gap-3">
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <Scale className="w-5 h-5 text-blue-400" />
                {getTrend(latestMetric, previousMetric, 'weight') && (
                  <span className={`text-xs flex items-center gap-1 ${getTrend(latestMetric, previousMetric, 'weight').direction === 'down' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {getTrend(latestMetric, previousMetric, 'weight').direction === 'down' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {getTrend(latestMetric, previousMetric, 'weight').value} {t.kg}
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white">{latestMetric.weight || '--'}</div>
              <div className="text-xs text-slate-400">{t.weight} ({t.kg})</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-2">
                <Activity className="w-5 h-5 text-orange-400" />
                {getTrend(latestMetric, previousMetric, 'bodyFat') && (
                  <span className={`text-xs flex items-center gap-1 ${getTrend(latestMetric, previousMetric, 'bodyFat').direction === 'down' ? 'text-emerald-400' : 'text-red-400'}`}>
                    {getTrend(latestMetric, previousMetric, 'bodyFat').direction === 'down' ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                    {getTrend(latestMetric, previousMetric, 'bodyFat').value}%
                  </span>
                )}
              </div>
              <div className="text-2xl font-bold text-white">{latestMetric.bodyFat || '--'}%</div>
              <div className="text-xs text-slate-400">{t.bodyFat}</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <Ruler className="w-5 h-5 text-purple-400 mb-2" />
              <div className="text-2xl font-bold text-white">{latestMetric.chest || '--'}</div>
              <div className="text-xs text-slate-400">{t.chest} ({t.cm})</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <Ruler className="w-5 h-5 text-pink-400 mb-2" />
              <div className="text-2xl font-bold text-white">{latestMetric.arms || '--'}</div>
              <div className="text-xs text-slate-400">{t.arms} ({t.cm})</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <Ruler className="w-5 h-5 text-yellow-400 mb-2" />
              <div className="text-2xl font-bold text-white">{latestMetric.waist || '--'}</div>
              <div className="text-xs text-slate-400">{t.waist} ({t.cm})</div>
            </div>

            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <Ruler className="w-5 h-5 text-cyan-400 mb-2" />
              <div className="text-2xl font-bold text-white">{latestMetric.thighs || '--'}</div>
              <div className="text-xs text-slate-400">{t.thighs} ({t.cm})</div>
            </div>
          </div>
        )}

        {!showForm ? (
          <button 
            onClick={() => setShowForm(true)}
            className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
          >
            <Plus className="w-5 h-5" /> {t.addMetric}
          </button>
        ) : (
          <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
            <h3 className="font-bold text-white mb-4">{t.updateProgress}</h3>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400">{t.weight} ({t.kg})</label>
                <input 
                  type="number" 
                  value={formData.weight}
                  onChange={(e) => setFormData({...formData, weight: e.target.value})}
                  placeholder="65"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t.bodyFat} (%)</label>
                <input 
                  type="number" 
                  value={formData.bodyFat}
                  onChange={(e) => setFormData({...formData, bodyFat: e.target.value})}
                  placeholder="15"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t.chest} ({t.cm})</label>
                <input 
                  type="number" 
                  value={formData.chest}
                  onChange={(e) => setFormData({...formData, chest: e.target.value})}
                  placeholder="95"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t.arms} ({t.cm})</label>
                <input 
                  type="number" 
                  value={formData.arms}
                  onChange={(e) => setFormData({...formData, arms: e.target.value})}
                  placeholder="35"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t.waist} ({t.cm})</label>
                <input 
                  type="number" 
                  value={formData.waist}
                  onChange={(e) => setFormData({...formData, waist: e.target.value})}
                  placeholder="75"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
              <div>
                <label className="text-xs text-slate-400">{t.thighs} ({t.cm})</label>
                <input 
                  type="number" 
                  value={formData.thighs}
                  onChange={(e) => setFormData({...formData, thighs: e.target.value})}
                  placeholder="55"
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg px-3 py-2 text-white mt-1"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <button 
                onClick={handleSave}
                className="flex-1 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" /> Save
              </button>
              <button 
                onClick={() => setShowForm(false)}
                className="bg-slate-800 text-slate-400 px-4 py-2 rounded-lg hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {metrics.length > 0 && (
          <div className="mt-6">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2">
              <History className="w-4 h-4 text-slate-400" />
              History
            </h3>
            <div className="space-y-2">
              {metrics.slice(0, 5).map((m, idx) => (
                <div key={m.id} className="bg-slate-900 p-3 rounded-lg border border-slate-800 flex justify-between items-center">
                  <div className="text-xs text-slate-400">{new Date(m.date).toLocaleDateString()}</div>
                  <div className="flex gap-4 text-sm">
                    {m.weight && <span className="text-blue-400">{m.weight}{t.kg}</span>}
                    {m.bodyFat && <span className="text-orange-400">{m.bodyFat}%</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Achievements View
const AchievementsView = ({ history, metrics, t }) => {
  const streak = calculateStreak(history);
  const totalVolume = getTotalVolume(history, {});
  const totalWorkouts = history.length;

  const unlockedAchievements = ACHIEVEMENTS.filter(a => {
    if (a.type === 'workouts') return totalWorkouts >= a.requirement;
    if (a.type === 'streak') return streak >= a.requirement;
    if (a.type === 'volume') return totalVolume >= a.requirement;
    return false;
  });

  const xp = totalWorkouts * 20 + unlockedAchievements.length * 50 + Math.floor(totalVolume / 10);
  const levelData = calculateLevel(xp);

  return (
    <div className="pb-24">
      <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-b border-slate-700">
        <h2 className="text-xl font-bold text-white flex items-center gap-2 mb-4">
          <Trophy className="w-5 h-5 text-yellow-500" />
          {t.achievements}
        </h2>

        {/* Level Progress */}
        <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-lg">
                {levelData.level}
              </div>
              <div>
                <div className="text-white font-bold">{t.level} {levelData.level}</div>
                <div className="text-xs text-slate-400">{levelData.xpInCurrentLevel}/100 XP</div>
              </div>
            </div>
            <div className="text-right text-sm text-slate-400">
              <div>{levelData.xpToNextLevel} XP</div>
              <div className="text-xs">{t.nextLevel}</div>
            </div>
          </div>
          <div className="h-2 bg-slate-800 rounded-full overflow-hidden">
            <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all" style={{ width: `${levelData.xpInCurrentLevel}%` }}></div>
          </div>
        </div>
      </div>

      <div className="p-4">
        {/* Stats Summary */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-2xl font-bold text-emerald-400">{totalWorkouts}</div>
            <div className="text-xs text-slate-400">Workouts</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-2xl font-bold text-orange-400">{streak}</div>
            <div className="text-xs text-slate-400">{t.streakDays}</div>
          </div>
          <div className="bg-slate-900 p-3 rounded-xl border border-slate-800 text-center">
            <div className="text-2xl font-bold text-blue-400">{totalVolume.toLocaleString()}</div>
            <div className="text-xs text-slate-400">{t.kg}</div>
          </div>
        </div>

        {/* Achievements Grid */}
        <h3 className="font-bold text-white mb-3">Badges</h3>
        <div className="grid grid-cols-3 gap-3">
          {ACHIEVEMENTS.map(achievement => {
            const isUnlocked = unlockedAchievements.some(a => a.id === achievement.id);
            return (
              <div 
                key={achievement.id}
                className={`p-4 rounded-xl border text-center transition-all ${isUnlocked ? 'bg-gradient-to-br from-slate-800 to-slate-900 border-yellow-500/50' : 'bg-slate-900 border-slate-800 opacity-50'}`}
              >
                <div className="text-3xl mb-2">{achievement.icon}</div>
                <div className={`text-xs font-bold ${isUnlocked ? 'text-white' : 'text-slate-500'}`}>
                  {t[achievement.nameKey]}
                </div>
                {isUnlocked && (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 mx-auto mt-1" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// Water Tracker Component
const WaterTracker = ({ glasses, onUpdate, t }) => {
  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Droplets className="w-5 h-5 text-blue-400" />
          <span className="font-bold text-white">{t.water}</span>
        </div>
        <span className="text-sm text-slate-400">{glasses}/8 {t.glasses}</span>
      </div>
      <div className="flex gap-2 mb-3">
        {[...Array(8)].map((_, idx) => (
          <button
            key={idx}
            onClick={() => onUpdate(idx + 1)}
            className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${idx < glasses ? 'bg-blue-500 text-white' : 'bg-slate-800 text-slate-600 border border-slate-700'}`}
          >
            <Droplets className="w-4 h-4" />
          </button>
        ))}
      </div>
      <div className="flex gap-2">
        <button 
          onClick={() => onUpdate(Math.max(0, glasses - 1))}
          className="flex-1 bg-slate-800 text-slate-400 py-1 rounded-lg text-sm hover:text-white"
        >
          <Minus className="w-4 h-4 inline" />
        </button>
        <button 
          onClick={() => onUpdate(Math.min(8, glasses + 1))}
          className="flex-1 bg-blue-600 text-white py-1 rounded-lg text-sm hover:bg-blue-500"
        >
          <Plus className="w-4 h-4 inline" />
        </button>
      </div>
    </div>
  );
};

// Wellness Check Component
const WellnessCheck = ({ wellness, onUpdate, t }) => {
  const energyLevels = [
    { value: 1, label: t.exhausted, color: 'text-red-400' },
    { value: 2, label: t.tired, color: 'text-orange-400' },
    { value: 3, label: t.okay, color: 'text-yellow-400' },
    { value: 4, label: t.good, color: 'text-lime-400' },
    { value: 5, label: t.excellent, color: 'text-emerald-400' },
  ];

  return (
    <div className="bg-slate-900 p-4 rounded-xl border border-slate-800 mb-4">
      <div className="flex items-center gap-2 mb-3">
        <Heart className="w-5 h-5 text-pink-400" />
        <span className="font-bold text-white">{t.logWellness}</span>
      </div>
      <div className="space-y-3">
        <div>
          <label className="text-xs text-slate-400 mb-1 block">{t.energy}</label>
          <div className="flex gap-1">
            {energyLevels.map(level => (
              <button
                key={level.value}
                onClick={() => onUpdate('energy', level.value)}
                className={`flex-1 py-1 rounded text-xs transition-all ${wellness.energy === level.value ? 'bg-slate-700 text-white' : 'bg-slate-800 text-slate-400'}`}
              >
                {level.label}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 mb-1 block">{t.sleep}</label>
          <input 
            type="range" 
            min="0" 
            max="12" 
            value={wellness.sleep || 7}
            onChange={(e) => onUpdate('sleep', parseInt(e.target.value))}
            className="w-full"
          />
          <div className="text-center text-sm text-white">{wellness.sleep || 7}h</div>
        </div>
      </div>
    </div>
  );
};

const SideMenu = ({ isOpen, onClose, t, onLangToggle, lang }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-slate-900 w-64 h-full border-r border-slate-800 shadow-2xl p-6 flex flex-col animate-in slide-in-from-left duration-200">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-xl font-bold text-white">{t.menuTitle}</h2>
          <button onClick={onClose}><X className="text-slate-400" /></button>
        </div>
        <div className="space-y-6 flex-1">
          <div className="flex items-center gap-3 text-white">
            <div className="bg-slate-800 p-2 rounded-lg"><User className="w-5 h-5 text-emerald-500" /></div>
            <div>
              <p className="font-bold text-sm">Champ</p>
              <p className="text-xs text-slate-400">{t.profile}</p>
            </div>
          </div>
          <div className="h-px bg-slate-800"></div>
          <button onClick={onLangToggle} className="flex items-center gap-3 text-slate-300 hover:text-white w-full">
            <div className="bg-slate-800 p-2 rounded-lg"><Settings className="w-5 h-5" /></div>
            <span className="text-sm font-medium">{lang === 'en' ? 'Switch to 繁體中文' : 'Switch to English'}</span>
          </button>
        </div>
        <div className="mt-auto text-center text-xs text-slate-600">
          <p>{t.aboutApp}</p>
          <p>{t.appVersion}</p>
        </div>
      </div>
    </div>
  );
};

const AboutModal = ({ onClose, t }) => (
  <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-6">
    <div className="bg-slate-900 p-6 rounded-2xl border border-slate-700 shadow-xl max-w-xs w-full text-center">
      <div className="bg-slate-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
        <Info className="w-8 h-8 text-emerald-500" />
      </div>
      <h2 className="text-lg font-bold text-white mb-2">{t.aboutApp}</h2>
      <p className="text-slate-400 text-sm mb-4">{t.appVersion}</p>
      <button onClick={onClose} className="w-full bg-slate-800 hover:bg-slate-700 text-white font-bold py-2 rounded-xl">
        {t.back}
      </button>
    </div>
  </div>
);

// CoachModal and RecipeModal
const CoachModal = ({ onClose, t }) => {
  const [messages, setMessages] = useState([{ sender: 'coach', text: t.coachIntro }]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setMessages(prev => [...prev, { sender: 'user', text: userMsg }]);
    setInput("");
    setLoading(true);
    const prompt = `You are IronCoach, a fitness expert. User Language: ${t === TRANSLATIONS.zh ? 'Traditional Chinese' : 'English'}. User asks: "${userMsg}"`;
    try {
      const response = await callGemini(prompt);
      setMessages(prev => [...prev, { sender: 'coach', text: response }]);
    } catch (e) {
      setMessages(prev => [...prev, { sender: 'coach', text: "Sorry champ, connection is weak." }]);
    }
    setLoading(false);
  };
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl flex flex-col h-[80vh] overflow-hidden animate-in zoom-in-95">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center bg-slate-900">
          <div className="flex items-center gap-2"><MessageSquare className="w-5 h-5 text-blue-400" /><h3 className="font-bold text-white">IronCoach</h3></div>
          <button onClick={onClose}><X className="text-slate-400" /></button>
        </div>
        <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-slate-950">
          {messages.map((msg, i) => (
            <div key={i} className={`flex ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] p-3 rounded-2xl text-sm ${msg.sender === 'user' ? 'bg-emerald-600 text-white' : 'bg-slate-800 text-slate-200'}`}>{msg.text}</div>
            </div>
          ))}
          {loading && <div className="text-xs text-slate-400 p-3"><Loader2 className="w-3 h-3 animate-spin inline" /> {t.coachThinking}</div>}
          <div ref={bottomRef} />
        </div>
        <div className="p-4 bg-slate-900 border-t border-slate-800 flex gap-2">
          <input value={input} onChange={(e) => setInput(e.target.value)} placeholder={t.typeQuestion} className="flex-1 bg-slate-950 border border-slate-700 rounded-full px-4 text-sm text-white" />
          <button onClick={handleSend} className="bg-emerald-600 p-2 rounded-full text-white"><Send className="w-5 h-5" /></button>
        </div>
      </div>
    </div>
  );
};

const RecipeModal = ({ onClose, missingProtein, t }) => {
  const [recipe, setRecipe] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    setLoading(true);
    const prompt = `Fitness Chef... Language: ${t === TRANSLATIONS.zh ? 'Traditional Chinese' : 'English'}. Create ONE simple snack recipe.`;
    callGemini(prompt).then(text => { setRecipe(text); setLoading(false); });
  }, []);
  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-slate-900 w-full max-w-sm rounded-2xl border border-slate-700 shadow-2xl p-6 relative animate-in zoom-in-95">
        <button onClick={onClose} className="absolute top-4 right-4 text-slate-400"><X /></button>
        <div className="flex items-center gap-3 mb-4"><ChefHat className="w-6 h-6 text-orange-500" /><h3 className="font-bold text-white text-lg">Protein Chef</h3></div>
        <div className="bg-slate-950 p-4 rounded-xl border border-slate-800 min-h-[150px] flex flex-col justify-center">
          {loading ? <div className="text-center text-slate-500"><Loader2 className="w-8 h-8 animate-spin mx-auto" />{t.chefThinking}</div> : <div className="text-sm text-slate-200 whitespace-pre-line">{recipe}</div>}
        </div>
      </div>
    </div>
  );
};

// --- MAIN APP ---

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isStorageLoaded, setIsStorageLoaded] = useState(false);
  const [isCheckingLocalData, setIsCheckingLocalData] = useState(false);
  const [useLocalMode, setUseLocalMode] = useState(false);
  
  // Migration states
  const [showMigrationDialog, setShowMigrationDialog] = useState(false);
  const [showMigrationSuccess, setShowMigrationSuccess] = useState(false);
  const [migrationResult, setMigrationResult] = useState(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [localDataToMigrate, setLocalDataToMigrate] = useState(null);
  const [remoteData, setRemoteData] = useState(null);
  const [view, setView] = useState('home'); 
  const [history, setHistory] = useState([]);
  const [activeWorkoutType, setActiveWorkoutType] = useState(null);
  const [completedExercises, setCompletedExercises] = useState([]);
  const [completedWarmups, setCompletedWarmups] = useState([]);
  const [workoutStartTime, setWorkoutStartTime] = useState(null);
  const [warmupMode, setWarmupMode] = useState(false);
  const [consumedFood, setConsumedFood] = useState([]);
  const [lang, setLang] = useState('zh');
  const [summaryStats, setSummaryStats] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [workoutMode, setWorkoutMode] = useState('machine');
  const [showModeToast, setShowModeToast] = useState(false);
  
  // NEW STATE
  const [exerciseData, setExerciseData] = useState({});
  const [showRestTimer, setShowRestTimer] = useState(false);
  const [lastCompletedExercise, setLastCompletedExercise] = useState(null);
  const [bodyMetrics, setBodyMetrics] = useState([]);
  const [waterGlasses, setWaterGlasses] = useState(0);
  const [wellness, setWellness] = useState({ energy: 3, sleep: 7 });
  const [personalRecords, setPersonalRecords] = useState({});
  const [goals, setGoals] = useState(null);
  const [workoutNotes, setWorkoutNotes] = useState('');
  
  // AI States
  const [showCoach, setShowCoach] = useState(false);
  const [showRecipe, setShowRecipe] = useState(false);
  const [showSideMenu, setShowSideMenu] = useState(false);
  const [showAbout, setShowAbout] = useState(false);
  const footerRef = useRef(null);

  // --- LOAD USER DATA FROM FIRESTORE ---
  const loadUserDataFromFirestore = async (uid) => {
    try {
      const userData = await getUserDataFromFirestore(uid);
      if (userData) {
        if (userData.history) setHistory(userData.history);
        if (userData.bodyMetrics) setBodyMetrics(userData.bodyMetrics);
        if (userData.consumedFood) setConsumedFood(userData.consumedFood);
        if (userData.wellness) setWellness(userData.wellness);
        if (userData.personalRecords) setPersonalRecords(userData.personalRecords);
        if (userData.goals) setGoals(userData.goals);
        if (userData.waterGlasses !== undefined) setWaterGlasses(userData.waterGlasses);
        if (userData.workoutMode) setWorkoutMode(userData.workoutMode);
        if (userData.lang) setLang(userData.lang);
      }
    } catch (error) {
      console.error('Error loading user data from Firestore:', error);
    }
  };

  // --- SAVE USER DATA TO FIRESTORE ---
  const saveUserDataToFirestoreWithProgress = async (uid, data, onProgress) => {
    try {
      const userDocRef = doc(db, 'users', uid);
      const progressPerItem = 80 / (Object.keys(data).length || 1); // 80% for data migration
      let currentProgress = 10; // Start at 10%
      
      onProgress(currentProgress);
      
      // Save all data in one batch
      const userData = {
        ...data,
        lastSyncAt: serverTimestamp(),
        migratedAt: serverTimestamp()
      };
      
      await setDoc(userDocRef, userData, { merge: true });
      
      currentProgress += progressPerItem;
      onProgress(Math.min(currentProgress, 90));
      
      // Final confirmation
      onProgress(100);
      
      return true;
    } catch (error) {
      console.error('Error saving user data to Firestore:', error);
      return false;
    }
  };

  // --- AUTH STATE LISTENER ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        setUser(firebaseUser);
        setUseLocalMode(false);
        
        // Check for remote data
        const remote = await checkForRemoteData(firebaseUser.uid);
        setRemoteData(remote);
        
        // Check for local data to potentially migrate
        const local = checkForLocalData();
        if (local && Object.keys(local).length > 0) {
          setLocalDataToMigrate(local);
          // Show migration dialog if user has local data
          setShowMigrationDialog(true);
        } else if (remote) {
          // No local data, but has remote data - load it
          await loadUserDataFromFirestore(firebaseUser.uid);
        }
        
        setLoading(false);
      } else if (!useLocalMode && user === null) {
        // User signed out or not logged in
        setUser(null);
        setLoading(false);
      }
    });
    
    return () => unsubscribe();
  }, [useLocalMode]);

  // --- INIT LOCAL STORAGE (for local mode) ---
  useEffect(() => {
    const loadData = () => {
        const storedHistory = localStorage.getItem('ironstart_history');
        if (storedHistory) {
            try {
                setHistory(JSON.parse(storedHistory));
            } catch (e) { console.error(e); }
        }

        const storedFood = localStorage.getItem('ironstart_food');
        if (storedFood) {
            try {
                const parsed = JSON.parse(storedFood);
                if (Array.isArray(parsed)) setConsumedFood(parsed);
                else setConsumedFood([]);
            } catch (e) { 
                console.error(e); 
                setConsumedFood([]);
            }
        }

        const storedLang = localStorage.getItem('ironstart_lang');
        if (storedLang) setLang(storedLang);

        const storedMode = localStorage.getItem('ironstart_mode');
        if (storedMode) setWorkoutMode(storedMode);
        
        const storedActive = localStorage.getItem('ironstart_active_workout');
        if (storedActive) {
             try {
                const active = JSON.parse(storedActive);
                if (active && active.type) {
                  setActiveWorkoutType(active.type);
                  setCompletedExercises(active.exercises || []);
                  setCompletedWarmups(active.warmups || []);
                  setWorkoutStartTime(active.startTime ? new Date(active.startTime) : null);
                  setWarmupMode(active.isWarmupMode);
                  setExerciseData(active.exerciseData || {});
                  setWorkoutNotes(active.notes || '');
                  setView('workout');
                }
             } catch(e) {}
        }

        // Load new data
        const storedMetrics = localStorage.getItem('ironstart_metrics');
        if (storedMetrics) {
          try {
            setBodyMetrics(JSON.parse(storedMetrics));
          } catch (e) {}
        }

        const storedWater = localStorage.getItem('ironstart_water');
        if (storedWater) {
          const today = new Date().toDateString();
          const waterData = JSON.parse(storedWater);
          if (waterData.date === today) {
            setWaterGlasses(waterData.glasses || 0);
          }
        }

        const storedWellness = localStorage.getItem('ironstart_wellness');
        if (storedWellness) {
          try {
            setWellness(JSON.parse(storedWellness));
          } catch (e) {}
        }

        const storedPRs = localStorage.getItem('ironstart_prs');
        if (storedPRs) {
          try {
            setPersonalRecords(JSON.parse(storedPRs));
          } catch (e) {}
        }

        const storedGoals = localStorage.getItem('ironstart_goals');
        if (storedGoals) {
          try {
            setGoals(JSON.parse(storedGoals));
          } catch (e) {}
        }

        setIsStorageLoaded(true);
        setLoading(false);
    };
    loadData();
  }, []);

  // --- SAVE EFFECTS ---
  useEffect(() => {
    if (isStorageLoaded) {
        localStorage.setItem('ironstart_food', JSON.stringify(consumedFood));
    }
  }, [consumedFood, isStorageLoaded]);
  
  useEffect(() => {
    if (isStorageLoaded) {
        localStorage.setItem('ironstart_lang', lang);
    }
  }, [lang, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
        localStorage.setItem('ironstart_mode', workoutMode);
    }
  }, [workoutMode, isStorageLoaded]);
  
  useEffect(() => {
    if (isStorageLoaded) {
        localStorage.setItem('ironstart_metrics', JSON.stringify(bodyMetrics));
    }
  }, [bodyMetrics, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
        localStorage.setItem('ironstart_water', JSON.stringify({
          date: new Date().toDateString(),
          glasses: waterGlasses
        }));
    }
  }, [waterGlasses, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
        localStorage.setItem('ironstart_wellness', JSON.stringify(wellness));
    }
  }, [wellness, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
        localStorage.setItem('ironstart_prs', JSON.stringify(personalRecords));
    }
  }, [personalRecords, isStorageLoaded]);

  useEffect(() => {
    if (isStorageLoaded) {
        localStorage.setItem('ironstart_goals', JSON.stringify(goals));
    }
  }, [goals, isStorageLoaded]);
  
  // --- PERSIST ACTIVE WORKOUT ---
  useEffect(() => {
    if (isStorageLoaded) {
        if (activeWorkoutType) {
          const activeState = {
              type: activeWorkoutType,
              exercises: completedExercises,
              warmups: completedWarmups,
              startTime: workoutStartTime ? workoutStartTime.toISOString() : null,
              isWarmupMode: warmupMode,
              exerciseData: exerciseData,
              notes: workoutNotes
          };
          localStorage.setItem('ironstart_active_workout', JSON.stringify(activeState));
        } else {
          localStorage.removeItem('ironstart_active_workout');
        }
    }
  }, [activeWorkoutType, completedExercises, completedWarmups, workoutStartTime, warmupMode, exerciseData, workoutNotes, isStorageLoaded]);

  const t = TRANSLATIONS[lang] || TRANSLATIONS['zh']; 
  const currentWorkouts = WORKOUTS_DATA[lang][workoutMode] || WORKOUTS_DATA['zh']['machine'];
  const currentWarmups = WARMUP_DATA[lang] || WARMUP_DATA['zh'];
  const currentFood = FOOD_ITEMS_DATA[lang] || FOOD_ITEMS_DATA['zh'];

  const lastWorkout = history[0];
  const nextWorkoutType = lastWorkout?.type === 'A' ? 'B' : 'A';
  
  const startWorkout = () => {
    if (workoutStartTime) {
      setView('workout');
    } else {
      setActiveWorkoutType(nextWorkoutType);
      setCompletedExercises([]);
      setCompletedWarmups([]);
      setWorkoutStartTime(new Date());
      setWarmupMode(true);
      setExerciseData({});
      setWorkoutNotes('');
      setView('workout');
    }
  };

  const discardWorkout = () => {
    setWorkoutStartTime(null);
    setCompletedExercises([]);
    setCompletedWarmups([]);
    setWarmupMode(false);
    setActiveWorkoutType(null);
    setExerciseData({});
    setWorkoutNotes('');
    localStorage.removeItem('ironstart_active_workout');
  };

  const toggleExercise = (id) => {
    const exercise = currentWorkouts[activeWorkoutType]?.exercises.find(e => e.id === id);
    const exerciseSets = exerciseData[id]?.sets || [];
    const completedSetsCount = exerciseSets.filter(s => s.completed).length;
    const allSetsDone = completedSetsCount >= exercise?.sets;
    
    // If uncompleting (clicking when already complete), always allow
    const isCurrentlyComplete = completedExercises.includes(id);
    
    if (isCurrentlyComplete) {
      // Allow uncompleting
      setCompletedExercises(prev => prev.filter(x => x !== id));
    } else if (allSetsDone) {
      // Only mark complete if all sets are done
      const newCompleted = [...completedExercises, id];
      setCompletedExercises(newCompleted);
      
      // Show rest timer after completing exercise
      setLastCompletedExercise(id);
      setShowRestTimer(true);
      
      if (activeWorkoutType && newCompleted.length === currentWorkouts[activeWorkoutType].exercises.length) {
        setTimeout(() => {
          footerRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 300);
      }
    } else {
      // Not all sets done - show feedback
      const remainingSets = (exercise?.sets || 0) - completedSetsCount;
      alert(`Complete all sets first! ${remainingSets} set${remainingSets > 1 ? 's' : ''} remaining.`);
    }
  };

  const toggleWarmup = (id) => {
    setCompletedWarmups(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const finishWarmup = () => setWarmupMode(false);

  const updateExerciseData = (exerciseId, data) => {
    setExerciseData(prev => ({
      ...prev,
      [exerciseId]: { ...prev[exerciseId], ...data }
    }));
  };

  const finishWorkout = async () => {
    if (isSubmitting) return;
    
    if (!activeWorkoutType || !currentWorkouts[activeWorkoutType]) {
      console.error("Invalid workout type", activeWorkoutType);
      alert("Something went wrong. Please try refreshing.");
      return;
    }

    setIsSubmitting(true);
    
    const duration = workoutStartTime ? Math.round((new Date() - workoutStartTime) / 60000) : 0;
    
    // Calculate total volume
    let totalVolume = 0;
    Object.values(exerciseData).forEach(data => {
      if (data && data.sets) {
        data.sets.forEach(set => {
          totalVolume += (set.weight || 0) * (set.reps || 0);
        });
      }
    });

    // Check for PRs and update
    const newPRs = { ...personalRecords };
    Object.entries(exerciseData).forEach(([exerciseId, data]) => {
      if (data && data.sets) {
        const maxWeight = Math.max(...data.sets.map(s => s.weight || 0), 0);
        if (!newPRs[exerciseId] || maxWeight > newPRs[exerciseId]) {
          newPRs[exerciseId] = maxWeight;
        }
      }
    });
    setPersonalRecords(newPRs);

    const logData = {
        id: crypto.randomUUID(),
        type: activeWorkoutType,
        mode: workoutMode,
        completedAt: new Date().toISOString(), 
        durationMinutes: duration,
        totalExercises: currentWorkouts[activeWorkoutType].exercises.length,
        completedCount: completedExercises.length,
        totalVolume: totalVolume,
        exerciseData: exerciseData,
        notes: workoutNotes
    };

    const newHistory = [logData, ...history];
    setHistory(newHistory);
    localStorage.setItem('ironstart_history', JSON.stringify(newHistory));
    
    localStorage.removeItem('ironstart_active_workout');

    setSummaryStats({
      ...logData,
      completedAt: new Date()
    });
    
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 }
    });

    setWorkoutStartTime(null);
    setIsSubmitting(false);
    setExerciseData({});
    setWorkoutNotes('');
    setView('summary');
  };

  const toggleFood = (id) => {
    setConsumedFood(prev => {
      if (!Array.isArray(prev)) return [id];
      return prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id];
    });
  };

  const toggleMode = () => {
    setWorkoutMode(prev => prev === 'machine' ? 'dumbbell' : 'machine');
    setShowModeToast(true);
    setTimeout(() => setShowModeToast(false), 2000);
  };

  const saveMetric = (metric) => {
    const newMetrics = [metric, ...bodyMetrics];
    setBodyMetrics(newMetrics);
  };

  const updateWater = (glasses) => {
    setWaterGlasses(glasses);
  };

  const updateWellness = (field, value) => {
    setWellness(prev => ({ ...prev, [field]: value }));
  };

  const saveGoal = (goal) => {
    setGoals(goal);
  };

  const currentProtein = consumedFood.reduce((total, id) => {
    const item = currentFood.find(f => f.id === id);
    return total + (item ? item.protein : 0);
  }, 0);

  let zoneColor = "text-red-500";
  let zoneMessage = t.dangerZone;
  let ZoneIcon = AlertTriangle;
  let barColor = "bg-red-500";

  if (currentProtein >= 60 && currentProtein < 90) {
    zoneColor = "text-yellow-400";
    zoneMessage = t.maintZone;
    ZoneIcon = Battery;
    barColor = "bg-yellow-400";
  } else if (currentProtein >= 90) {
    zoneColor = "text-emerald-400";
    zoneMessage = t.growthZone;
    ZoneIcon = Zap;
    barColor = "bg-emerald-500";
  }

  const toggleLang = () => {
    setLang(l => l === 'en' ? 'zh' : 'en');
    setShowSideMenu(false);
  };

  if (loading) return <LoadingScreen t={t} />;

  return (
    <div className="min-h-screen bg-slate-950 text-white font-sans">
      
      {/* AI Modals */}
      {showCoach && <CoachModal onClose={() => setShowCoach(false)} t={t} />}
      {showRecipe && <RecipeModal onClose={() => setShowRecipe(false)} missingProtein={Math.max(0, 120 - currentProtein)} t={t} />}
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} t={t} />}
      
      {showModeToast && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 bg-slate-800 text-white px-4 py-2 rounded-full shadow-xl z-50 animate-in fade-in slide-in-from-top-4 flex items-center gap-2">
          {workoutMode === 'machine' ? <Settings className="w-4 h-4 text-emerald-500" /> : <Dumbbell className="w-4 h-4 text-emerald-500" />}
          <span className="text-sm font-bold">{t.switchedTo} {workoutMode === 'machine' ? t.machineMode : t.dumbbellMode}</span>
        </div>
      )}

      <SideMenu 
        isOpen={showSideMenu} 
        onClose={() => setShowSideMenu(false)} 
        t={t} 
        lang={lang} 
        onLangToggle={toggleLang} 
      />

      {/* --- HOME VIEW --- */}
      {view === 'home' && (
        <div className="pb-24">
          <div className="p-6 bg-gradient-to-br from-slate-900 to-slate-800 border-b border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <button 
                onClick={() => setShowSideMenu(true)} 
                className="bg-slate-800 p-2 rounded-lg border border-slate-700 hover:bg-slate-700 transition-colors"
              >
                <Menu className="w-6 h-6 text-white" />
              </button>
              
              <div className="text-center">
                <h1 className="text-xl font-bold">{t.welcome}</h1>
                <p className="text-emerald-400 text-xs font-medium">{workoutMode === 'machine' ? t.subtitleMachine : t.subtitleDumbbell}</p>
              </div>

              <button 
                onClick={toggleMode} 
                className={`p-2 rounded-lg border transition-all ${workoutMode === 'dumbbell' ? 'bg-emerald-600 border-emerald-500 text-white' : 'bg-slate-800 border-slate-700 text-slate-400 hover:bg-slate-700'}`}
              >
                <Dumbbell className="w-6 h-6" />
              </button>
            </div>
            
            {/* Level Progress */}
            <div className="bg-slate-950/50 p-3 rounded-lg border border-slate-700/50 mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-gradient-to-br from-yellow-500 to-orange-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {calculateLevel(history.length * 20 + Math.floor(getTotalVolume(history, {}) / 10)).level}
                  </div>
                  <div>
                    <div className="text-sm font-medium text-white">{t.level} {calculateLevel(history.length * 20 + Math.floor(getTotalVolume(history, {}) / 10)).level}</div>
                    <div className="text-xs text-slate-400">{calculateLevel(history.length * 20 + Math.floor(getTotalVolume(history, {}) / 10)).xpInCurrentLevel}/100 XP</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-bold text-emerald-400">{history.length}</div>
                  <div className="text-xs text-slate-400">{t.streak}</div>
                </div>
              </div>
              <div className="h-1.5 bg-slate-800 rounded-full overflow-hidden">
                <div className="h-full bg-gradient-to-r from-yellow-500 to-orange-500" style={{ width: `${calculateLevel(history.length * 20 + Math.floor(getTotalVolume(history, {}) / 10)).xpInCurrentLevel}%` }}></div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="flex gap-4">
              <div className="flex-1 bg-slate-950/50 p-3 rounded-lg border border-slate-700/50">
                <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">{t.streak}</p>
                <div className="flex items-center gap-2 mt-1">
                  <Flame className="w-5 h-5 text-orange-500" />
                  <span className="text-xl font-bold">{calculateStreak(history)}</span>
                </div>
              </div>
              <div className="flex-1 bg-slate-950/50 p-3 rounded-lg border border-slate-700/50">
                 <p className="text-slate-400 text-xs uppercase font-bold tracking-wider">{t.status}</p>
                 <div className="flex items-center gap-2 mt-1">
                   <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
                   <span className="text-sm font-medium">{t.active}</span>
                 </div>
              </div>
            </div>
          </div>

          <div className="p-6 space-y-4">
            <div className="bg-emerald-600 rounded-2xl p-6 shadow-lg shadow-emerald-900/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 -mr-4 -mt-4 bg-white/10 rounded-full blur-2xl w-32 h-32"></div>
              
              {workoutStartTime ? (
                <>
                  <span className="inline-block px-3 py-1 bg-black/20 rounded-full text-xs font-bold mb-3 text-orange-100 animate-pulse">In Progress</span>
                  <h3 className="text-3xl font-bold mb-1">{currentWorkouts[activeWorkoutType].name.split(':')[0]}</h3>
                  <p className="text-emerald-100 mb-6">{currentWorkouts[activeWorkoutType].focus}</p>
                  <div className="flex gap-2">
                    <button onClick={startWorkout} className="flex-1 bg-white text-emerald-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors shadow-sm">
                      {t.resumeWorkout} <Play className="w-5 h-5" />
                    </button>
                    <button onClick={discardWorkout} className="bg-emerald-800/50 text-white font-bold px-4 py-3 rounded-xl flex items-center justify-center hover:bg-red-900/50 transition-colors">
                      <XCircle className="w-5 h-5" />
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <span className="inline-block px-3 py-1 bg-black/20 rounded-full text-xs font-bold mb-3 text-emerald-100">{t.recommended}</span>
                  <h3 className="text-3xl font-bold mb-1">{currentWorkouts[nextWorkoutType].name.split(':')[0]}</h3>
                  <p className="text-emerald-100 mb-6">{currentWorkouts[nextWorkoutType].focus}</p>
                  <button onClick={startWorkout} className="w-full bg-white text-emerald-700 font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-50 transition-colors shadow-sm">
                    {t.startWorkout} <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            </div>
            
            <div 
              onClick={() => setView('food')}
              className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex items-center gap-4 cursor-pointer hover:bg-slate-800 transition-colors"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-4 border-slate-800 flex items-center justify-center bg-slate-800">
                   <span className={`text-xs font-bold ${zoneColor}`}>{currentProtein}g</span>
                </div>
                <svg className="w-12 h-12 absolute top-0 left-0 -rotate-90">
                  <circle cx="24" cy="24" r="22" className="stroke-slate-700 stroke-4 fill-none" />
                  <circle cx="24" cy="24" r="22" className={`stroke-4 fill-none transition-all duration-700 ${barColor.replace('bg', 'stroke')}`} strokeDasharray="138" strokeDashoffset={138 - (138 * Math.min(currentProtein, 120) / 120)} />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-white">{t.foodTracker}</h3>
                <p className="text-xs text-slate-400">{t.trackGoal}</p>
              </div>
              <div className="bg-slate-800 p-2 rounded-full">
                <Utensils className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Water Tracker */}
            <WaterTracker glasses={waterGlasses} onUpdate={updateWater} t={t} />

            {/* Goals Quick View */}
            {goals && (
              <div 
                onClick={() => setView('goals')}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 cursor-pointer hover:bg-slate-800 transition-colors"
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-emerald-500" />
                    <span className="font-bold text-white">{t.goals}</span>
                  </div>
                  <ChevronRight className="w-5 h-5 text-slate-400" />
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {goals.targetWeight && (
                    <div className="bg-slate-800 p-2 rounded">
                      <span className="text-slate-400">{t.goalWeight}:</span>
                      <span className="text-white ml-1">{goals.targetWeight}kg</span>
                    </div>
                  )}
                  <div className="bg-slate-800 p-2 rounded">
                    <span className="text-slate-400">{t.goalWorkouts}:</span>
                    <span className="text-white ml-1">{goals.weeklyWorkouts}/wk</span>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Access Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button 
                onClick={() => setView('progress')}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <BarChart3 className="w-6 h-6 text-blue-400" />
                <span className="text-sm text-white">{t.progress}</span>
              </button>
              <button 
                onClick={() => setView('metrics')}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <TrendingUp className="w-6 h-6 text-purple-400" />
                <span className="text-sm text-white">{t.metrics}</span>
              </button>
              <button 
                onClick={() => setView('achievements')}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <Trophy className="w-6 h-6 text-yellow-400" />
                <span className="text-sm text-white">{t.achievements}</span>
              </button>
              <button 
                onClick={() => setShowCoach(true)}
                className="bg-slate-900 p-4 rounded-xl border border-slate-800 flex flex-col items-center gap-2 hover:bg-slate-800 transition-colors"
              >
                <MessageSquare className="w-6 h-6 text-emerald-400" />
                <span className="text-sm text-white">{t.askCoach}</span>
              </button>
            </div>

            {/* Wellness Check */}
            <WellnessCheck wellness={wellness} onUpdate={updateWellness} t={t} />
          </div>
        </div>
      )}

      {/* --- WORKOUT VIEW --- */}
      {view === 'workout' && activeWorkoutType && (
        <div className="pb-32">
          <div className="sticky top-0 z-10 bg-slate-900 border-b border-slate-800 p-4">
            <div className="flex items-center justify-between">
              <button onClick={() => setView('home')} className="flex items-center gap-2 text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="font-bold text-white">{currentWorkouts[activeWorkoutType]?.name}</h2>
              <div className="text-xs text-slate-400">
                {completedExercises.length}/{currentWorkouts[activeWorkoutType]?.exercises?.length || 0}
              </div>
            </div>
            {workoutStartTime && (
              <div className="mt-2 text-center text-xs text-slate-400">
                Started at {workoutStartTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </div>
            )}
          </div>

          {warmupMode ? (
            <div className="p-4">
              <div className="bg-orange-900/30 border border-orange-500/30 rounded-xl p-4 mb-6">
                <h3 className="font-bold text-orange-400 flex items-center gap-2 mb-2">
                  {t.warmupTitle}
                </h3>
                <p className="text-orange-200 text-sm">{t.warmupDesc}</p>
              </div>
              
              {currentWarmups.map((exercise) => (
                <WarmupCard 
                  key={exercise.id}
                  exercise={exercise}
                  onComplete={toggleWarmup}
                  isCompleted={completedWarmups.includes(exercise.id)}
                />
              ))}

              <button 
                onClick={finishWarmup}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl mt-4 flex items-center justify-center gap-2"
              >
                {t.startLifting} <ArrowRight className="w-5 h-5" />
              </button>
              <button 
                onClick={() => setWarmupMode(false)}
                className="w-full text-slate-400 text-sm py-3 hover:text-white"
              >
                {t.skipWarmup}
              </button>
            </div>
          ) : (
            <div className="p-4">
              {/* Rest Timer Modal */}
              {showRestTimer && (
                <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
                  <RestTimer 
                    duration={90} 
                    onComplete={() => setShowRestTimer(false)}
                    t={t}
                  />
                </div>
              )}
              
              {currentWorkouts[activeWorkoutType]?.exercises?.map((exercise) => (
                <ExerciseCard 
                  key={exercise.id}
                  exercise={exercise}
                  onComplete={toggleExercise}
                  isCompleted={completedExercises.includes(exercise.id)}
                  exerciseData={exerciseData[exercise.id]}
                  onUpdateData={updateExerciseData}
                  t={t}
                />
              ))}

              {/* Workout Notes */}
              <div className="mt-4 bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="flex items-center gap-2 mb-2">
                  <Edit3 className="w-4 h-4 text-slate-400" />
                  <span className="text-sm font-bold text-white">{t.workoutNotes}</span>
                </div>
                <textarea
                  value={workoutNotes}
                  onChange={(e) => setWorkoutNotes(e.target.value)}
                  placeholder={t.addNote}
                  className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white text-sm resize-none h-20"
                />
              </div>

              <div ref={footerRef} className="mt-6">
                <button 
                  onClick={finishWorkout}
                  disabled={isSubmitting || completedExercises.length === 0}
                  className={`w-full font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-all ${
                    completedExercises.length > 0 
                      ? 'bg-emerald-600 hover:bg-emerald-500 text-white' 
                      : 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" /> {t.saving}
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-5 h-5" /> {t.finishWorkout}
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* --- FOOD VIEW --- */}
      {view === 'food' && (
        <div className="pb-24">
          <div className="p-6 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center gap-3">
              <button onClick={() => setView('home')} className="text-slate-400 hover:text-white">
                <ArrowLeft className="w-5 h-5" />
              </button>
              <h2 className="text-xl font-bold text-white">{t.foodTracker}</h2>
            </div>
          </div>

          <div className="p-4 space-y-4">
            {/* Protein Summary */}
            <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
              <div className="flex items-center justify-between mb-3">
                <span className="text-slate-400">{t.trackGoal}</span>
                <span className={`font-bold ${zoneColor}`}>{currentProtein}/120g</span>
              </div>
              <div className="h-3 bg-slate-800 rounded-full overflow-hidden">
                <div className={`h-full transition-all ${barColor}`} style={{ width: `${Math.min(currentProtein / 120 * 100, 100)}%` }}></div>
              </div>
              <div className={`mt-3 p-2 rounded-lg flex items-center gap-2 ${zoneColor.replace('text', 'bg')}/10`}>
                <ZoneIcon className={`w-4 h-4 ${zoneColor}`} />
                <span className={`text-sm font-medium ${zoneColor}`}>{zoneMessage}</span>
              </div>
            </div>

            {/* Food Timeline */}
            <div className="space-y-3">
              {[
                { key: 'morning', icon: Sunrise, label: t.morning },
                { key: 'preGym', icon: Utensils, label: t.preGym },
                { key: 'postGym', icon: Zap, label: t.postGym },
                { key: 'dinner', icon: Sunset, label: t.dinner },
                { key: 'snack', icon: Moon, label: t.snack },
              ].map(({ key, icon: Icon, label }) => (
                <div key={key} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="flex items-center gap-2 mb-3">
                    <Icon className="w-4 h-4 text-slate-400" />
                    <span className="text-sm font-bold text-white">{label}</span>
                  </div>
                  {currentFood.filter(f => f.timingKey === key).map(food => (
                    <div 
                      key={food.id}
                      onClick={() => toggleFood(food.id)}
                      className={`p-3 rounded-lg border cursor-pointer transition-all mb-2 ${
                        consumedFood.includes(food.id) 
                          ? 'bg-emerald-900/30 border-emerald-500/50' 
                          : 'bg-slate-800 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex justify-between items-center">
                        <div>
                          <h4 className={`font-medium ${consumedFood.includes(food.id) ? 'text-emerald-400' : 'text-white'}`}>
                            {food.name}
                          </h4>
                          <p className="text-xs text-slate-400">{food.desc}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className={`text-sm font-bold ${consumedFood.includes(food.id) ? 'text-emerald-400' : 'text-slate-300'}`}>
                            +{food.protein}g
                          </span>
                          {consumedFood.includes(food.id) && (
                            <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Recipe Suggestion */}
            {currentProtein < 100 && (
              <button 
                onClick={() => setShowRecipe(true)}
                className="w-full bg-orange-600 hover:bg-orange-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2"
              >
                <ChefHat className="w-5 h-5" /> {t.suggestSnack}
              </button>
            )}

            <button 
              onClick={() => setConsumedFood([])}
              className="w-full text-slate-400 text-sm py-2 hover:text-white"
            >
              {t.reset}
            </button>
          </div>
        </div>
      )}

      {/* --- HISTORY VIEW --- */}
      {view === 'history' && (
        <div className="pb-24">
          <div className="p-6 bg-slate-900 border-b border-slate-800">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <button onClick={() => setView('home')} className="text-slate-400 hover:text-white">
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-bold text-white">{t.history}</h2>
              </div>
              {history.length > 0 && (
                <button
                  onClick={() => {
                    const csvRows = [
                      ['Date','Type','Mode','Duration(min)','Volume(kg)','Exercises'].join(','),
                      ...history.map(w => [
                        new Date(w.completedAt).toLocaleDateString(),
                        w.type || '',
                        w.mode || '',
                        w.durationMinutes || '',
                        w.exercises ? w.exercises.reduce((sum, ex) => sum + (ex.sets || []).reduce((s, set) => s + ((parseFloat(set.weight)||0) * (parseInt(set.reps)||0)), 0), 0).toFixed(1) : '',
                        w.exercises ? w.exercises.map(e => e.name).join('; ') : ''
                      ].join(','))
                    ];
                    const blob = new Blob([csvRows.join('\n')], { type: 'text/csv' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `ironstart-history-${new Date().toISOString().slice(0,10)}.csv`;
                    a.click();
                    URL.revokeObjectURL(url);
                  }}
                  className="flex items-center gap-1 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                  <Download className="w-3.5 h-3.5" />
                  {t.exportData || 'Export CSV'}
                </button>
              )}
            </div>
          </div>

          <div className="p-4 space-y-3">
            {history.length === 0 ? (
              <div className="text-center py-12">
                <CalendarDays className="w-12 h-12 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-400">{t.noWorkouts}</p>
              </div>
            ) : (
              history.map((workout) => (
                <div key={workout.id} className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h3 className="font-bold text-white">
                        {workout.mode === 'dumbbell' ? 'Free Weight' : 'Machine'} {workout.type}
                      </h3>
                      <p className="text-xs text-slate-400">
                        {new Date(workout.completedAt).toLocaleDateString()} • {workout.durationMinutes} {t.minutes}
                      </p>
                    </div>
                    <div className="text-right">
                      <div className="text-emerald-400 font-bold">{workout.completedCount}/{workout.totalExercises}</div>
                      <div className="text-xs text-slate-400">{t.exercisesCount}</div>
                    </div>
                  </div>
                  {workout.totalVolume > 0 && (
                    <div className="mt-2 pt-2 border-t border-slate-800 flex justify-between text-sm">
                      <span className="text-slate-400">{t.totalVolume}</span>
                      <span className="text-blue-400 font-bold">{workout.totalVolume.toLocaleString()} {t.kg}</span>
                    </div>
                  )}
                  {workout.notes && (
                    <div className="mt-2 pt-2 border-t border-slate-800 text-sm text-slate-300 italic">
                      "{workout.notes}"
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* --- SUMMARY VIEW --- */}
      {view === 'summary' && summaryStats && (
        <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6">
          <div className="text-center max-w-sm">
            <div className="w-24 h-24 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <Trophy className="w-12 h-12 text-white" />
            </div>
            <h1 className="text-3xl font-bold text-white mb-2">{t.workoutComplete}</h1>
            <p className="text-slate-400 mb-8">{t.greatJob}</p>
            
            <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-emerald-400">{summaryStats.completedCount}</div>
                <div className="text-xs text-slate-400">{t.exercisesCount}</div>
              </div>
              <div className="bg-slate-900 p-4 rounded-xl border border-slate-800">
                <div className="text-2xl font-bold text-blue-400">{summaryStats.durationMinutes}</div>
                <div className="text-xs text-slate-400">{t.minutes}</div>
              </div>
              {summaryStats.totalVolume > 0 && (
                <div className="col-span-2 bg-slate-900 p-4 rounded-xl border border-slate-800">
                  <div className="text-2xl font-bold text-purple-400">{summaryStats.totalVolume.toLocaleString()} {t.kg}</div>
                  <div className="text-xs text-slate-400">{t.totalVolume}</div>
                </div>
              )}
            </div>

            <button 
              onClick={() => { setSummaryStats(null); setView('home'); }}
              className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2"
            >
              {t.backHome} <ArrowRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

      {/* --- OTHER VIEWS --- */}
      {view === 'goals' && <GoalsView goals={goals} onSave={saveGoal} t={t} />}
      {view === 'progress' && <ProgressView history={history} metrics={bodyMetrics} t={t} />}
      {view === 'metrics' && <MetricsView metrics={bodyMetrics} onSave={saveMetric} t={t} />}
      {view === 'achievements' && <AchievementsView history={history} metrics={bodyMetrics} t={t} />}

      {/* --- BOTTOM NAV --- */}
      {view !== 'summary' && (
        <div className="fixed bottom-0 left-0 right-0 bg-slate-900 border-t border-slate-800 px-6 py-3 flex justify-around">
          <button 
            onClick={() => setView('home')}
            className={`flex flex-col items-center gap-1 ${view === 'home' ? 'text-emerald-400' : 'text-slate-400'}`}
          >
            <Dumbbell className="w-6 h-6" />
            <span className="text-xs">{t.plan}</span>
          </button>
          <button 
            onClick={() => setView('food')}
            className={`flex flex-col items-center gap-1 ${view === 'food' ? 'text-emerald-400' : 'text-slate-400'}`}
          >
            <Utensils className="w-6 h-6" />
            <span className="text-xs">{t.food}</span>
          </button>
          <button 
            onClick={() => setView('history')}
            className={`flex flex-col items-center gap-1 ${view === 'history' ? 'text-emerald-400' : 'text-slate-400'}`}
          >
            <History className="w-6 h-6" />
            <span className="text-xs">{t.history}</span>
          </button>
          <button 
            onClick={() => setView('achievements')}
            className={`flex flex-col items-center gap-1 ${view === 'achievements' ? 'text-emerald-400' : 'text-slate-400'}`}
          >
            <Trophy className="w-6 h-6" />
            <span className="text-xs">{t.achievements}</span>
          </button>
        </div>
      )}
    </div>
  );
}
