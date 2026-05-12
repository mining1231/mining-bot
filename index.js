require("dotenv").config();

const {
  Client,
  GatewayIntentBits,
  EmbedBuilder,
  AttachmentBuilder,
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  StringSelectMenuBuilder,
  UserSelectMenuBuilder,
  ModalBuilder,
  TextInputBuilder,
  TextInputStyle
} = require("discord.js");

const { createCanvas, loadImage, registerFont } = require("canvas");

registerFont("./assets/fonts/ssurround.ttf", {
  family: "Ssurround"
});

function drawMultilineText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const metrics = ctx.measureText(testLine);
    const testWidth = metrics.width;

    if (testWidth > maxWidth && i > 0) {
      ctx.fillText(line, x, y);
      line = words[i] + " ";
      y += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, y);
}

function drawBalanceText(ctx, money, gain, y, x) {
  const moneyText = `${money.toLocaleString()}원`;
  const gainText =
    gain >= 0
      ? `+${gain.toLocaleString()}원`
      : `-${Math.abs(gain).toLocaleString()}원`;

  const fullText = `${moneyText} (${gainText})`;

  // 오른쪽 최대 허용 좌표
  const maxRightX = 1180;

  // 전체 텍스트 폭
  const fullWidth = ctx.measureText(fullText).width;

  // 한 줄로 썼을 때 오른쪽을 넘는지 체크
  if (x + fullWidth <= maxRightX) {
    ctx.fillText(fullText, x, y);
  } else {
    // 잔액은 첫 줄
    ctx.fillText(moneyText, x, y);

    // 증감액은 둘째 줄
    ctx.fillText(`(${gainText})`, x, y + 58);
  }
}

const fs = require("fs");

registerFont("./assets/fonts/SUIT-Bold.ttf", {
  family: "SUIT Bold"
});

const gameData = require("./data/gameData.js");
const gatherSystem = require("./data/gatherData.js");
const itemData = require("./data/itemData.js");
const farmSystem = require("./data/farmData.js");
const cropsData = require("./data/cropsData.js");
const marketData = require("./data/marketData.js");
const shopData = require("./data/shopData.js");
const petData = require("./data/petData.js");
const path = require("path");

const USERS_FILE = path.join(__dirname, "users.json");
const COUPONS_FILE = path.join(__dirname, "coupons.json");
const MARKET_FILE = path.join(__dirname, "market.json");
const LOG_DIR = path.join(__dirname, "logs");

const ERROR_LOG_DIR = path.join(LOG_DIR, "errors");
const COMMAND_LOG_DIR = path.join(LOG_DIR, "commands");
const USER_LOG_DIR = path.join(LOG_DIR, "users");

const ERROR_LOG_FILE = path.join(ERROR_LOG_DIR, "error.csv");
const COMMAND_LOG_FILE = path.join(COMMAND_LOG_DIR, "command.csv");

function readJsonFile(filePath, fallback) {
  try {
    if (!fs.existsSync(filePath)) return fallback;

    const raw = fs.readFileSync(filePath, "utf8");

    if (!raw.trim()) return fallback;

    return JSON.parse(raw);
  } catch (err) {
    console.error(`[JSON 읽기 실패] ${filePath}`, err);
    return fallback;
  }
}

function writeJsonFile(filePath, data) {
  const tempPath = `${filePath}.tmp`;

  fs.writeFileSync(
    tempPath,
    JSON.stringify(data, null, 2)
  );

  fs.renameSync(tempPath, filePath);
}

function ensureLogDirs() {
  if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });
  if (!fs.existsSync(ERROR_LOG_DIR)) fs.mkdirSync(ERROR_LOG_DIR, { recursive: true });
  if (!fs.existsSync(COMMAND_LOG_DIR)) fs.mkdirSync(COMMAND_LOG_DIR, { recursive: true });
  if (!fs.existsSync(USER_LOG_DIR)) fs.mkdirSync(USER_LOG_DIR, { recursive: true });
}

function csvSafe(value) {
  return `"${String(value ?? "").replace(/"/g, '""')}"`;
}

function appendCsvLine(filePath, headers, values) {
  ensureLogDirs();

  const exists = fs.existsSync(filePath);

  if (!exists) {
    fs.appendFileSync(
  filePath,
  "\uFEFF" + headers.map(csvSafe).join(",") + "\n",
  "utf8"
);
  }

  fs.appendFileSync(
  filePath,
  values.map(csvSafe).join(",") + "\n",
  "utf8"
);
}

function formatLogTime() {
  const now = new Date();

  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  const hh = String(now.getHours()).padStart(2, "0");
  const mi = String(now.getMinutes()).padStart(2, "0");
  const ss = String(now.getSeconds()).padStart(2, "0");

  return `${yyyy}-${mm}-${dd} ${hh}:${mi}:${ss}`;
}

function getCommandOptionText(interaction) {
  try {
    if (!interaction.options?.data?.length) return "";

    return interaction.options.data
      .map(option => {
        if (option.options?.length) {
          const subOptions = option.options
            .map(sub => `${sub.name}:${sub.value}`)
            .join(" ");

          return `${option.name} ${subOptions}`;
        }

        return `${option.name}:${option.value}`;
      })
      .join(" ");
  } catch {
    return "";
  }
}

function getInteractionLogText(interaction) {
  if (interaction.isChatInputCommand()) {
    const optionText = getCommandOptionText(interaction);

    return optionText
      ? `/${interaction.commandName} ${optionText}`
      : `/${interaction.commandName}`;
  }

  if (interaction.isButton()) {
    return `[버튼 클릭] customId:${interaction.customId}`;
  }

  if (interaction.isStringSelectMenu()) {
    return `[선택 메뉴] customId:${interaction.customId} 값:${interaction.values.join(", ")}`;
  }

  if (interaction.isUserSelectMenu()) {
    return `[유저 선택] customId:${interaction.customId} 유저:${interaction.values.join(", ")}`;
  }

  if (interaction.isModalSubmit()) {
    return `[모달 제출] customId:${interaction.customId}`;
  }

  return `[기타 상호작용]`;
}

function logCommandUse(interaction) {
  try {
    const time = formatLogTime();
    const userTag = interaction.user?.tag || interaction.user?.username || "unknown";
    const userId = interaction.user?.id || "unknown";
    const guildName = interaction.guild?.name || "DM";
    const guildId = interaction.guild?.id || "DM";
    const channelName = interaction.channel?.name || "unknown";
    const channelId = interaction.channel?.id || "unknown";
    const logText = getInteractionLogText(interaction);

    appendCsvLine(
      COMMAND_LOG_FILE,
      ["시간", "유저태그", "유저ID", "서버", "서버ID", "채널", "채널ID", "사용내용"],
      [time, userTag, userId, guildName, guildId, channelName, channelId, logText]
    );

    appendCsvLine(
      path.join(USER_LOG_DIR, `${userId}.csv`),
      ["시간", "서버", "채널", "사용내용"],
      [time, guildName, channelName, logText]
    );
  } catch (err) {
    console.error("명령어 로그 저장 실패:", err);
  }
}

function logGameResult(interaction, resultText) {
  try {
    const time = formatLogTime();
    const userTag = interaction.user?.tag || interaction.user?.username || "unknown";
    const userId = interaction.user?.id || "unknown";
    const guildName = interaction.guild?.name || "DM";
    const guildId = interaction.guild?.id || "DM";
    const channelName = interaction.channel?.name || "unknown";
    const channelId = interaction.channel?.id || "unknown";

    appendCsvLine(
      COMMAND_LOG_FILE,
      ["시간", "유저태그", "유저ID", "서버", "서버ID", "채널", "채널ID", "사용내용"],
      [time, userTag, userId, guildName, guildId, channelName, channelId, `[결과] ${resultText}`]
    );

    appendCsvLine(
      path.join(USER_LOG_DIR, `${userId}.csv`),
      ["시간", "서버", "채널", "사용내용"],
      [time, guildName, channelName, `[결과] ${resultText}`]
    );
  } catch (err) {
    console.error("결과 로그 저장 실패:", err);
  }
}

/* ================= 윷 상태 & 경로 ================= */

// 말 상태
const yutState = {
  sheep: [
    { pos: -1, finished: false },
    { pos: -1, finished: false }
  ],
  wolf: [
    { pos: -1, finished: false },
    { pos: -1, finished: false }
  ]
};

// 윷판 경로
const YUT_PATH = [
  { x: 1370, y: 690 }, // 1칸
  { x: 1370, y: 520 }, // 2칸
  { x: 1370, y: 360 }, // 3칸
  { x: 1370, y: 202 }, // 4칸
  { x: 1370, y: 55 }, // 5칸
  { x: 1075, y: 55 }, // 6칸
  { x: 847, y: 55 }, // 7칸
  { x: 622, y: 55 }, // 8칸
  { x: 387, y: 55 }, // 9칸
  { x: 161, y: 55 }, // 10칸
  { x: 161, y: 202 }, // 11칸
  { x: 161, y: 360 }, // 12칸
  { x: 161, y: 520 }, // 13칸
  { x: 161, y: 690 }, // 14칸
  { x: 161, y: 880 }, // 15칸
  { x: 387, y: 880 }, // 16칸
  { x: 622, y: 880 }, // 17칸
  { x: 850, y: 880 }, // 18칸
  { x: 1080, y: 880 }, // 19칸
  { x: 1370, y: 880 }, // 20칸
];

const BOARD_IMAGE_PATH = "./assets/yut-board.png";
const P1_PIECE_IMAGE_PATH = "./assets/piece-sheep.png";
const P2_PIECE_IMAGE_PATH = "./assets/piece-wolf.png";

const P1_STACK_IMAGE_PATH = "./assets/piece-sheep-stack.png";
const P2_STACK_IMAGE_PATH = "./assets/piece-wolf-stack.png";

/* ================= 시작/완주 좌표 ================= */

// 시작 위치 기준점
const SHEEP_START_CENTER = { x: 450, y: 250 }; // 양 시작
const WOLF_START_CENTER  = { x: 1100, y: 750 }; // 늑대 시작

// 완주 위치 기준점
const SHEEP_GOAL_CENTER = { x: 1100, y: 250 };  // 양 완주
const WOLF_GOAL_CENTER  = { x: 450, y: 750 };  // 늑대 완주

console.log("gameData keys:", Object.keys(gameData));
console.log("has weapons:", !!gameData.weapons);
console.log("has upgrade:", !!gameData.upgrade);

const levelEmojis = {
  1: "<:one:1501619428565979358>",
  2: "<:two:1501619511244357652>",
  3: "<:three:1501619566638399698>",
  4: "<:four:1501619630735888606>",
  5: "<:five:1501619678597091378>",
  6: "<:six:1501619761627533423>",
  7: "<:seven:1501619801771212861>",
  8: "<:eight:1501619895828349038>",
  9: "<:nine:1501620073809313885>",
  10: "<:ten:1501620134236655676>"
};

const ADMIN_ID = "1496408494507692095";

const JOIN_LOG_CHANNEL_ID = "1502603873733447732";
const LEAVE_LOG_CHANNEL_ID = "1502603916020551732";
const YUT_CHANNEL_IDS = [
  "1492836361181335674",
  "1492843277114671334",
  "1492843357960142940",
  "1492843392491589713",
  "1492843416076288123"
];

const activeInteractions = new Set();
const upgradeCollectors = new Map();
const engraveCollectors = new Map();

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMembers
  ]
});

const pubgPlayingUsers = new Set();

const defaultUser = {
  money: 50000,
  level: 1,
  durability: 100,
  engraveLevel: 0,
  joinDate: "",

  pet: {
  key: null,
  level: 1,
  optionChoice: null
},

  farmLevel: 1,
  farmExp: 0,
  farmCount: 0,
  lastFarmAt: 0,
  lastFarmResetDate: "",
  canGatherToday: false,

  lastAttackDate: "",
  lastLootAt: 0,
  lastLottoAt: 0,
  bankruptcyCooldown: 0,

  attendanceDays: 0,
  lastAttendanceDate: "",

  farmCrops: {
    peach: 0,
    strawberry: 0,
    shineMuscat: 0,
    apple: 0,
    wildGinseng: 0
  },

  gatherLevel: 1,
  gatherExp: 0,
  gatherCount: 0,
  lastGatherAt: 0,
  lastGatherResetDate: "",

  exploreCount: 0,
  lastExploreAt: 0,
  lastExploreResetDate: "",

  inventory: {
    repairStone: 0,
    engraveStone: 0,
    questionBox: 0,
    depositDoubleCoupon: 0,
    randomTransferCoupon: 0,
    wildGinsengPiece: 0,
    petFood: 0
  },

  shopPurchase: {
  lastResetDate: "",
  engraveStoneBoughtToday: 0,
  questionBoxBoughtToday: 0
  },

  transfer: {
  lastResetDate: "",
  usedCount: 0,
  maxCount: 10
}
};

/* ================= 윷놀이 ================= */
let yutEnabled = true;
const yutGames = new Map();
const YUT_BOARD_SIZE = 20;

function createYutGame(channelId, player1Id, player2Id) {
  yutGames.set(channelId, {
    channelId,

    player1: {
      id: player1Id,
      pieces: [-1, -1],
      finishedCount: 0
    },

    player2: {
      id: player2Id,
      pieces: [-1, -1],
      finishedCount: 0
    },

    turn: null,
    started: false,
    finished: false,
    winner: null,

    pendingRoll: null,
    pendingSteps: 0,
    extraTurn: false,
    waitingForAccept: true,
    acceptedBy: [],

    createdAt: Date.now()
  });

  return yutGames.get(channelId);
}

function getYutGame(channelId) {
  return yutGames.get(channelId);
}

function deleteYutGame(channelId) {
  yutGames.delete(channelId);
}

function getYutPlayer(game, userId) {
  if (game.player1.id === userId) return game.player1;
  if (game.player2.id === userId) return game.player2;
  return null;
}

function getYutOpponent(game, userId) {
  if (game.player1.id === userId) return game.player2;
  if (game.player2.id === userId) return game.player1;
  return null;
}

function isYutPlayer(game, userId) {
  return game.player1.id === userId || game.player2.id === userId;
}

/* ================= 윷 확률 함수 ================= */
function rollYut() {
  const rand = Math.random() * 100;

  if (rand < 12) {
    return { name: "빽도", steps: -1 };
  } else if (rand < 42) {
    return { name: "도", steps: 1 };
  } else if (rand < 67) {
    return { name: "개", steps: 2 };
  } else if (rand < 82) {
    return { name: "걸", steps: 3 };
  } else if (rand < 94) {
    return { name: "윷", steps: 4 };
  } else {
    return { name: "모", steps: 5 };
  }
}

function getPieceStatusText(player) {
  return player.pieces
    .map((pos, index) => {
      if (pos === -1) return `말 ${index + 1}: 출발 전`;
      if (pos >= YUT_BOARD_SIZE) return `말 ${index + 1}: 완주`;
      return `말 ${index + 1}: ${pos + 1}칸 이동`;
    })
    .join("\n");
}

/* ================= 말 이동 ================= */
function moveYutPiece(player, pieceIndex, steps) {
  const currentPos = player.pieces[pieceIndex];

  if (currentPos >= YUT_BOARD_SIZE) {
    return { moved: false, reason: "이미 완주한 말입니다." };
  }

  if (currentPos === -1 && steps < 0) {
    return { moved: false, reason: "출발 전 말은 빽도로 이동할 수 없습니다." };
  }

  let newPos;

  // 출발 전
  if (currentPos === -1) {
    newPos = steps - 1;
  } else {
    newPos = currentPos + steps;

    if (newPos < 0) {
      newPos = YUT_BOARD_SIZE + newPos; // 뒤로 넘어가면 끝으로
    }
  }

  // 업은 말 확인
  const samePieces = [];

  if (currentPos >= 0 && currentPos < YUT_BOARD_SIZE) {
    for (let i = 0; i < player.pieces.length; i++) {
      if (player.pieces[i] === currentPos) {
        samePieces.push(i);
      }
    }
  } else {
    samePieces.push(pieceIndex);
  }

  // 완주 처리
  if (newPos >= YUT_BOARD_SIZE) {
    player.finishedCount += samePieces.length;
  }

  // 같이 이동
  for (const i of samePieces) {
    player.pieces[i] = newPos;
  }

  return {
    moved: true,
    newPos,
    movedPieces: samePieces
  };
}

/* ================= 윷판 이미지 함수 ================= */
async function drawYutBoardTestPieces(channelId) {
  const boardImage = await loadImage(BOARD_IMAGE_PATH);
  const sheepImage = await loadImage(P1_PIECE_IMAGE_PATH);
  const wolfImage = await loadImage(P2_PIECE_IMAGE_PATH);
  const sheepStackImage = await loadImage(P1_STACK_IMAGE_PATH);
  const wolfStackImage = await loadImage(P2_STACK_IMAGE_PATH);

  const canvas = createCanvas(boardImage.width, boardImage.height);
  const ctx = canvas.getContext("2d");

  ctx.drawImage(boardImage, 0, 0, boardImage.width, boardImage.height);

  const pieceWidth = 120;
  const pieceHeight = 120;
  const gap = 60;

  const drawCentered = (img, x, y, width = pieceWidth, height = pieceHeight) => {
  ctx.drawImage(
    img,
    x - width / 2,
    y - height / 2,
    width,
    height
  );
};

  const game = getYutGame(channelId);

  if (!game) {
    return canvas.toBuffer("image/png");
  }

  function drawPlayerPieces(pieces, image, stackImage, startCenter, goalCenter) {
    const grouped = new Map();

    // 같은 위치끼리 묶기
    for (let i = 0; i < pieces.length; i++) {
      const pos = pieces[i];

      if (!grouped.has(pos)) {
        grouped.set(pos, []);
      }

      grouped.get(pos).push(i);
    }

    for (const [pos, indexes] of grouped.entries()) {

      // 시작 위치
      if (pos === -1) {
        if (indexes.length === 1) {
          const offset = indexes[0] === 0 ? -gap : gap;
          drawCentered(image, startCenter.x + offset, startCenter.y);
        } else {
          drawCentered(image, startCenter.x - gap, startCenter.y);
          drawCentered(image, startCenter.x + gap, startCenter.y);
        }
      }

      // 완주 위치
      else if (pos >= YUT_BOARD_SIZE) {
        if (indexes.length === 1) {
          const offset = indexes[0] === 0 ? -gap : gap;
          drawCentered(image, goalCenter.x + offset, goalCenter.y);
        } else {
          drawCentered(image, goalCenter.x - gap, goalCenter.y);
          drawCentered(image, goalCenter.x + gap, goalCenter.y);
        }
      }

      // 중간 경로
      else {
        const center = YUT_PATH[pos];

        if (indexes.length === 1) {
          drawCentered(image, center.x, center.y);
        } else {
          drawCentered(stackImage, center.x, center.y -3, 170, 170);
        }
      }
    }
  }

  // 양
  drawPlayerPieces(
    game.player1.pieces,
    sheepImage,
    sheepStackImage,
    SHEEP_START_CENTER,
    SHEEP_GOAL_CENTER
  );

  // 늑대
  drawPlayerPieces(
    game.player2.pieces,
    wolfImage,
    wolfStackImage,
    WOLF_START_CENTER,
    WOLF_GOAL_CENTER
  );

  return canvas.toBuffer("image/png");
}

let users = {};
let coupons = {};
let marketState = {
  market: {},
  lastUpdate: 0
};

function getRandomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function getRepairAmount() {
  const rand = Math.random() * 100;

  if (rand < 27) return 10;
  if (rand < 57) return 30;
  if (rand < 82) return 50;
  if (rand < 97) return 70;
  return 100;
}


function getAttackBossInfo(level) {
  if (level >= 1 && level <= 9) {
    return {
      bossName: "고블린",
      minDurabilityLoss: 1,
      maxDurabilityLoss: 5
    };
  }

  if (level >= 10 && level <= 19) {
    return {
      bossName: "오크",
      minDurabilityLoss: 6,
      maxDurabilityLoss: 10
    };
  }

  if (level >= 20 && level <= 29) {
    return {
      bossName: "트롤대장",
      minDurabilityLoss: 11,
      maxDurabilityLoss: 15
    };
  }

  if (level >= 30 && level <= 39) {
    return {
      bossName: "돌골렘",
      minDurabilityLoss: 16,
      maxDurabilityLoss: 20
    };
  }

  if (level >= 40 && level <= 49) {
    return {
      bossName: "고대골렘",
      minDurabilityLoss: 21,
      maxDurabilityLoss: 25
    };
  }

  if (level === 50) {
    return {
      bossName: "잊혀진 지배자",
      minDurabilityLoss: 21,
      maxDurabilityLoss: 30
    };
  }

  return null;
}

function generateMarket() {
  const market = {};

  for (const key in marketData) {
    market[key] = generateMarketPrice(marketData[key]);
  }

  return market;
}

users = readJsonFile(USERS_FILE, {});
coupons = readJsonFile(COUPONS_FILE, {});
marketState = readJsonFile(MARKET_FILE, marketState);

function saveUsers() {
  writeJsonFile(USERS_FILE, users);
}

function openQuestionBox() {
  const rand = Math.random() * 100;

  if (rand < 43) {
    const money = Math.floor(Math.random() * (6500000 - 5000000 + 1)) + 5000000;
    return {
      type: "money",
      value: money,
      text: `<:money:1489876006893518968> ${money.toLocaleString()}원을 획득했다밍!`
    };
  }

  if (rand < 44) {
    return {
      type: "repair",
      value: 1,
      text: "<:repair:1489875654886297640> 수리석 1개를 획득했다밍!"
    };
  }

  if (rand < 54) {
    return {
      type: "empty",
      value: 0,
      text: "📦 빈 상자... 아무것도 나오지 않았다밍ㅜ."
    };
  }

  if (rand < 67) {
    const peach = Math.floor(Math.random() * (4000 - 3000 + 1)) + 3000;
    return {
      type: "peach",
      value: peach,
      text: `🍑 복숭아 ${peach.toLocaleString()}개를 획득했다밍!`
    };
  }

  if (rand < 80) {
    const strawberry = Math.floor(Math.random() * (200 - 90 + 1)) + 90;
    return {
      type: "strawberry",
      value: strawberry,
      text: `🍓 딸기 ${strawberry.toLocaleString()}개를 획득했다밍!`
    };
  }

  if (rand < 88) {
    const shine = Math.floor(Math.random() * (3 - 2 + 1)) + 2;
    return {
      type: "shineMuscat",
      value: shine,
      text: `<:grape:1489872445555867759> 샤인머스켓 ${shine}개를 획득했다밍!`
    };
  }

  if (rand < 89) {
    return {
      type: "apple",
      value: 1,
      text: "🍎 사과 1개를 획득했다밍!"
    };
  }

  if (rand < 93.5) {
    const exp = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
    return {
      type: "farmExp",
      value: exp,
      text: `농사 경험치 +${exp}를 획득했다밍!`
    };
  }

  if (rand < 98) {
    const exp = Math.floor(Math.random() * (20 - 10 + 1)) + 10;
    return {
      type: "gatherExp",
      value: exp,
      text: `카페 경험치 +${exp}를 획득했다밍!`
    };
  }

  if (rand < 99) {
    return {
      type: "randomTransferCoupon",
      value: 1,
      text: "<:coupon2:1497620249766268938> 송금 랜덤 쿠폰 1개를 획득했다밍!"
    };
  }

  return {
    type: "depositDoubleCoupon",
    value: 1,
    text: "<:coupon:1496892441213665492> 송금 더블 쿠폰 1개를 획득했다밍!"
  };
}

/* ================= 말 이동 ================= */
function movePiece(piece, move) {
  if (piece.finished) return;

  if (piece.pos === -1) {
    piece.pos = 0;
    move -= 1;
  }

  if (move > 0) {
    piece.pos += move;
  }

  if (piece.pos >= YUT_PATH.length) {
    piece.finished = true;
    piece.pos = YUT_PATH.length - 1;
  }
}

/* ================= 좌표 가져오기 ================= */
function getPieceCenter(piece, team) {
  if (piece.finished) {
    return team === "sheep" ? SHEEP_GOAL_CENTER : WOLF_GOAL_CENTER;
  }

  if (piece.pos === -1) {
    return team === "sheep" ? SHEEP_START_CENTER : WOLF_START_CENTER;
  }

  return YUT_PATH[piece.pos];
}

function saveCoupons() {
  writeJsonFile(COUPONS_FILE, coupons);
}

function saveMarket() {
  writeJsonFile(MARKET_FILE, marketState);
}

const engraveData = {
  1:  { stone: 1, success: 95, keep: 5, destroy: 0 },
  2:  { stone: 1, success: 90, keep: 10, destroy: 0 },
  3:  { stone: 1, success: 85, keep: 15, destroy: 0 },
  4:  { stone: 1, success: 80, keep: 20, destroy: 0 },
  5:  { stone: 2, success: 75, keep: 25, destroy: 0 },
  6:  { stone: 2, success: 70, keep: 30, destroy: 0 },
  7:  { stone: 2, success: 65, keep: 35, destroy: 0 },
  8:  { stone: 2, success: 60, keep: 40, destroy: 0 },
  9:  { stone: 3, success: 55, keep: 45, destroy: 0 },
  10: { stone: 3, success: 50, keep: 50, destroy: 0 },

  11: { stone: 3, success: 45, keep: 55, destroy: 0 },
  12: { stone: 3, success: 40, keep: 60, destroy: 0 },
  13: { stone: 4, success: 35, keep: 65, destroy: 0 },
  14: { stone: 4, success: 30, keep: 70, destroy: 0 },
  15: { stone: 4, success: 30, keep: 70, destroy: 0 },
  16: { stone: 4, success: 30, keep: 67.9, destroy: 2.1 },
  17: { stone: 5, success: 30, keep: 67.9, destroy: 2.1 },
  18: { stone: 5, success: 15, keep: 78.2, destroy: 6.8 },
  19: { stone: 5, success: 15, keep: 78.2, destroy: 6.8 },
  20: { stone: 5, success: 15, keep: 76.5, destroy: 8.5 },

  21: { stone: 5, success: 30, keep: 59.5, destroy: 10.5 },
  22: { stone: 6, success: 15, keep: 72.25, destroy: 12.75 },
  23: { stone: 6, success: 15, keep: 68, destroy: 17 },
  24: { stone: 6, success: 11, keep: 70.8, destroy: 18.2 },
  25: { stone: 6, success: 10, keep: 71.6, destroy: 18.4 },
  26: { stone: 7, success: 9, keep: 72.4, destroy: 18.6 },
  27: { stone: 7, success: 7, keep: 74.2, destroy: 18.8 },
  28: { stone: 7, success: 5, keep: 75.8, destroy: 19.2 },
  29: { stone: 8, success: 3, keep: 77.4, destroy: 19.6 },
  30: { stone: 8, success: 2, keep: 78, destroy: 20 }
};

const engraveBonusPercent = {
  1: 0.3,
  2: 0.6,
  3: 0.9,
  4: 1.2,
  5: 1.6,
  6: 2.0,
  7: 2.4,
  8: 2.8,
  9: 3.3,
  10: 3.8,
  11: 4.3,
  12: 4.8,
  13: 5.4,
  14: 6.0,
  15: 6.6,
  16: 7.2,
  17: 8.0,
  18: 9.5,
  19: 11.0,
  20: 12.5,
  21: 14.5,
  22: 16.5,
  23: 18.5,
  24: 20.5,
  25: 22.5,
  26: 24.5,
  27: 27.0,
  28: 30.0,
  29: 33.0,
  30: 37.0
};

function getEngraveBonusPercent(level) {
  return engraveBonusPercent[level] || 0;
}

function getEngraveStars(level) {
  let stars = "";

  const blue = Math.floor(level / 10);      // 10단위
  const pink = Math.floor((level % 10) / 5); // 5단위
  const yellow = level % 5;                 // 1단위

  stars += "<:star3:1493809296520249345>".repeat(blue);
  stars += "<:star2:1493809262529609839>".repeat(pink);
  stars += "<:star1:1493809167897591920>".repeat(yellow);

  return stars;
}

const attendanceBonus = {
  10: 300000,
  30: 1000000,
  50: 3000000,
  100: 5000000,
  200: 20000000,
  300: 50000000,
  365: 36500000,
  400: 100000000,
  500: 150000000
};

function getTodayKey() {
  return new Date().toLocaleDateString("ko-KR");
}

function formatTodayText() {
  const now = new Date();
  const month = now.getMonth() + 1;
  const date = now.getDate();
  return `${month}월 ${date}일`;
}

function rand(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

function getRandomTargetPrice(data) {
  const range = data.max - data.min;
  const zone = Math.random();

  // 저점 / 중간 / 고점 목표가를 랜덤으로 고름
  if (zone < 0.33) {
    return rand(data.min, data.min + Math.floor(range * 0.35));
  }

  if (zone < 0.66) {
    return rand(
      data.min + Math.floor(range * 0.35),
      data.min + Math.floor(range * 0.7)
    );
  }

  return rand(data.min + Math.floor(range * 0.7), data.max);
}

function getNextTargetChangeAt() {
  const min = 4 * 60 * 60 * 1000; // 4시간
  const max = 8 * 60 * 60 * 1000; // 8시간

  return Date.now() + rand(min, max);
}

function updateSingleMarket(key, currentPrice, data) {
  if (!marketState.targets) {
    marketState.targets = {};
  }

  if (!marketState.targets[key]) {
    marketState.targets[key] = {
      targetPrice: getRandomTargetPrice(data),
      nextChangeAt: getNextTargetChangeAt()
    };
  }

  const target = marketState.targets[key];

  // 4~8시간 지나면 새 목표가 설정
  if (Date.now() >= target.nextChangeAt) {
    target.targetPrice = getRandomTargetPrice(data);
    target.nextChangeAt = getNextTargetChangeAt();
  }

  let price = currentPrice ?? rand(data.min, data.max);

  // 최고가 찍으면 무조건 하락
  if (price >= data.max) {
    price -= rand(data.stepMin, data.stepMax);
  }

  // 최저가 찍으면 무조건 상승
  else if (price <= data.min) {
    price += rand(data.stepMin, data.stepMax);
  }

  // 목표가보다 낮으면 상승
  else if (price < target.targetPrice) {
    price += rand(data.stepMin, data.stepMax);
  }

  // 목표가보다 높으면 하락
  else if (price > target.targetPrice) {
    price -= rand(data.stepMin, data.stepMax);
  }

  price = clamp(price, data.min, data.max);

  return price;
}

function generateMarket() {
  return {
    peach: rand(marketData.peach.min, marketData.peach.max),
    strawberry: rand(marketData.strawberry.min, marketData.strawberry.max),
    shineMuscat: rand(marketData.shineMuscat.min, marketData.shineMuscat.max),
    apple: rand(marketData.apple.min, marketData.apple.max),
    wildGinseng: rand(marketData.wildGinseng.min, marketData.wildGinseng.max)
  };
}

function updateMarket(currentMarket = {}) {
  return {
    peach: updateSingleMarket("peach", currentMarket.peach, marketData.peach),
    strawberry: updateSingleMarket("strawberry", currentMarket.strawberry, marketData.strawberry),
    shineMuscat: updateSingleMarket("shineMuscat", currentMarket.shineMuscat, marketData.shineMuscat),
    apple: updateSingleMarket("apple", currentMarket.apple, marketData.apple),
    wildGinseng: updateSingleMarket("wildGinseng", currentMarket.wildGinseng, marketData.wildGinseng)
  };
}

// 👇 여기쯤 (함수들 모여있는 곳)
function getPetByKey(key) {
  for (const grade of Object.values(petData)) {
    const found = grade.find(pet => pet.key === key);
    if (found) return found;
  }
  return null;
}

// 👇 바로 아래에 넣어도 좋음
function applyCooldownPet(user, cooldown) {
  if (user.pet?.key === "otter") {
    const pet = getPetByKey("otter");
    let reduce = 0;

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          reduce = pet.option.values[lvl];
          break;
        }
      }
    }

    return Math.floor(cooldown * (1 - reduce));
  }

  return cooldown;
}

// 👇 여기부터 추가
function getLootResult(user) {
  let topChance = 1; // 기본 최상급 1%

  // 🐧 펭구 옵션
  if (user?.pet?.key === "penguin") {
    const pet = getPetByKey("penguin");
    let petChance = 1;

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          petChance = pet.option.values[lvl];
          break;
        }
      }
    }

    topChance = petChance;
  }

  const rand = Math.random() * 100;

  // 🔥 최상급
  if (rand < topChance) {
    return {
      grade: "최상급",
      value: 10000000,
      color: "#F59E0B",
      emoji: "<:booty_4:1490638753398521856>",
      message: "**한 눈에 봐도 어마어마한 가치… 최상급 전리품이다밍!!**"
    };
  }

  // 🔥 하급
  if (rand < 35) {
    return {
      grade: "하급",
      value: 500000,
      color: "#9CA3AF",
      emoji: "<:booty_1:1490638590437359616>",
      message: "**먼지가 가득한 곳에서 쓸만한 하급 전리품을 발견했다밍!**"
    };
  }

  // 🔥 중급
  if (rand < 85) {
    return {
      grade: "중급",
      value: 2000000,
      color: "#3B82F6",
      emoji: "<:booty_2:1490638660218130504>",
      message: "**이 정도면 꽤 성공적인 수확이다밍! 중급 전리품을 획득했다밍!**"
    };
  }

  // 🔥 상급
  return {
    grade: "상급",
    value: 5000000,
    color: "#A855F7",
    emoji: "<:booty_3:1490638710780465182>",
    message: "**오늘 운 미쳤다밍… 상급 전리품이다밍!**"
  };
}

// 여기부터 새로 추가
function resetDailyShopLimit(user) {
  const today = new Date().toLocaleDateString("ko-KR");

  if (!user.shopPurchase) {
    user.shopPurchase = {
      lastResetDate: "",
      engraveStoneBoughtToday: 0,
      questionBoxBoughtToday: 0
    };
  }

  if (user.shopPurchase.lastResetDate !== today) {
    user.shopPurchase.lastResetDate = today;
    user.shopPurchase.engraveStoneBoughtToday = 0;
    user.shopPurchase.questionBoxBoughtToday = 0;
  }
}

function resetDailyTransferLimit(user) {
  const today = new Date().toLocaleDateString("ko-KR");

  if (!user.transfer) {
    user.transfer = {
      lastResetDate: "",
      usedCount: 0,
      maxCount: 10
    };
  }

  if (user.transfer.lastResetDate !== today) {
    user.transfer.lastResetDate = today;
    user.transfer.usedCount = 0;
    user.transfer.maxCount = 10;
  }

  if (user.transfer.maxCount === undefined) {
    user.transfer.maxCount = 10;
  }
}

function buildShopEmbed(user) {
  return new EmbedBuilder()
    .setColor("#E5E7EB")
    .setTitle("상점")
    .setDescription(
`아래 항목에서 원하는 상품을 선택해 주세요.

<:box:1492879878838816849> 물음표박스
하루 구매 제한: ${user.shopPurchase.questionBoxBoughtToday || 0}/2

잔액: ${user.money.toLocaleString()}원

⚠️ 선택 시 바로 구매됩니다.`
    );
}

function buildShopSelectMenu(user) {
  return new StringSelectMenuBuilder()
    .setCustomId("shop_select")
    .setPlaceholder("상품을 선택해 주세요.")
    .addOptions([
      {
        label: "Lv10 비파형 동검",
        description: "1,000,000원",
        value: "weapon15",
        emoji: {
          id: "1489875492051091536",
          name: "weapon"
        }
      },
      {
        label: "Lv20 갈퀴",
        description: "20,000,000원",
        value: "weapon25",
        emoji: {
          id: "1489875492051091536",
          name: "weapon"
        }
      },
      {
        label: "Lv30 롱소드",
        description: "300,000,000원",
        value: "weapon35",
        emoji: {
          id: "1489875492051091536",
          name: "weapon"
        }
      },

      // 기존 물음표박스
      {
        label: `물음표박스 (${user.shopPurchase.questionBoxBoughtToday || 0}/2)`,
        description: "5,000,000원",
        value: "questionBox",
        emoji: {
          id: "1492879878838816849",
          name: "box"
        }
      },

      // 🔥 여기부터 추가 (각인석)
      {
        label: "각인석 1개",
        description: "100,000,000원",
        value: "engraveStone_1",
        emoji: { name: "💫" }
      },
      {
        label: "각인석 50개 묶음",
        description: "4,700,000,000원",
        value: "engraveStone_50",
        emoji: { name: "💫" }
      },
      {
        label: "각인석 100개 묶음",
        description: "8,500,000,000원",
        value: "engraveStone_100",
        emoji: { name: "💫" }
      }
    ]);
}

function buildPetShopEmbed(user) {
  return new EmbedBuilder()
    .setColor("#F9A8D4")
    .setTitle("**펫 상점**")
    .setDescription(
`**아래 항목에서 원하는 펫 상품을 선택해 주세요.**

<:money:1489876006893518968> **잔액: ${user.money.toLocaleString()}원**

⚠️ 선택 시 바로 구매됩니다!`
    );
}

function buildPetShopSelectMenu(user) {
  return new StringSelectMenuBuilder()
    .setCustomId("pet_shop_select")
    .setPlaceholder("펫 상품을 선택해 주세요.")
    .addOptions([
      {
        label: "일반 펫뽑기",
        description: "50,000,000원 / D~B 등급 등장",
        value: "normal_pet_gacha",
        emoji: {
          id: "1500819056737914941",
          name: "capsule"
        }
      },
      {
        label: "펫먹이",
        description: "5,000,000원",
        value: "pet_food",
        emoji: {
          id: "1501244821983989831",
          name: "food"
        }
      }
    ]);
}

// 여기까지 새로 추가
function pickFarmCrop(crops) {
  const rand = Math.random() * 100;
  let cumulative = 0;

  for (const crop of crops) {
    cumulative += crop.chance;
    if (rand <= cumulative) {
      return crop;
    }
  }

  return crops[crops.length - 1];
}

function ensureUser(id) {
  if (!users[id]) {
    users[id] = JSON.parse(JSON.stringify(defaultUser));
  }

  const user = users[id];

  if (!user.joinDate) {
  user.joinDate = new Date().toLocaleDateString("ko-KR");
}

  if (user.lastAttackDate === undefined) user.lastAttackDate = "";
  if (user.lastLootAt === undefined) user.lastLootAt = 0;
  if (user.lastLottoAt === undefined) user.lastLottoAt = 0;
  if (user.bankruptcyCooldown === undefined) user.bankruptcyCooldown = 0;
  if (user.attendanceDays === undefined) user.attendanceDays = 0;
  if (user.lastAttendanceDate === undefined) user.lastAttendanceDate = "";
  if (user.money === undefined) user.money = 50000;
  if (user.level === undefined) user.level = 1;
  if (user.durability === undefined) user.durability = 100;
  if (user.engraveLevel === undefined) user.engraveLevel = 0;

  if (!user.pet) {
  user.pet = {
    key: null,
    level: 1,
    optionChoice: null
  };
}

if (user.pet.key === undefined) user.pet.key = null;
if (user.pet.level === undefined) user.pet.level = 1;
if (user.pet.optionChoice === undefined) user.pet.optionChoice = null;

  if (user.farmLevel === undefined) user.farmLevel = 1;
  if (user.farmExp === undefined) user.farmExp = 0;
  if (user.farmCount === undefined) user.farmCount = 0;
  if (user.lastFarmAt === undefined) user.lastFarmAt = 0;
  if (user.lastFarmResetDate === undefined) user.lastFarmResetDate = "";
  if (user.canGatherToday === undefined) user.canGatherToday = false;

  if (!user.farmCrops) user.farmCrops = {};
  if (user.farmCrops.peach === undefined) user.farmCrops.peach = 0;
  if (user.farmCrops.strawberry === undefined) user.farmCrops.strawberry = 0;
  if (user.farmCrops.shineMuscat === undefined) user.farmCrops.shineMuscat = 0;
  if (user.farmCrops.apple === undefined) user.farmCrops.apple = 0;
  if (user.farmCrops.wildGinseng === undefined) user.farmCrops.wildGinseng = 0;

  if (user.gatherLevel === undefined) user.gatherLevel = 1;
  if (user.gatherExp === undefined) user.gatherExp = 0;
  if (user.gatherCount === undefined) user.gatherCount = 0;
  if (user.lastGatherAt === undefined) user.lastGatherAt = 0;
  if (user.lastGatherResetDate === undefined) user.lastGatherResetDate = "";
  if (user.exploreCount === undefined) user.exploreCount = 0;
  if (user.lastExploreAt === undefined) user.lastExploreAt = 0;
  if (user.lastExploreResetDate === undefined) user.lastExploreResetDate = "";

  if (!user.inventory) user.inventory = {};
  if (user.inventory.repairStone === undefined) user.inventory.repairStone = 0;
  if (user.inventory.engraveStone === undefined) user.inventory.engraveStone = 0;
  if (user.inventory.questionBox === undefined) user.inventory.questionBox = 0;
  if (user.inventory.depositDoubleCoupon === undefined) user.inventory.depositDoubleCoupon = 0;
  if (user.inventory.randomTransferCoupon === undefined) user.inventory.randomTransferCoupon = 0;

  if (user.inventory.wildGinsengPiece === undefined) {
  user.inventory.wildGinsengPiece = 0;
}

if (user.inventory.petFood === undefined) {
  user.inventory.petFood = 0;
}

  if (!user.shopPurchase) user.shopPurchase = {};
  if (user.shopPurchase.lastResetDate === undefined) user.shopPurchase.lastResetDate = "";
  if (user.shopPurchase.engraveStoneBoughtToday === undefined) user.shopPurchase.engraveStoneBoughtToday = 0;
  if (user.shopPurchase.questionBoxBoughtToday === undefined) user.shopPurchase.questionBoxBoughtToday = 0;

  if (!user.transfer) user.transfer = {};
  if (user.transfer.lastResetDate === undefined) user.transfer.lastResetDate = "";
  if (user.transfer.usedCount === undefined) user.transfer.usedCount = 0;
  if (user.transfer.maxCount === undefined) user.transfer.maxCount = 10;

  saveUsers();
  return user;
}

function updatePetHunger(user) {
  if (!user.pet?.key) return;

  const now = Date.now();

  if (!user.pet.lastHungerAt) {
    user.pet.lastHungerAt = now;
    return;
  }

  const diff = now - user.pet.lastHungerAt;

  const interval = 6 * 60 * 60 * 1000; // 🔥 6시간으로 변경

  const passed = Math.floor(diff / interval);

  if (passed <= 0) return;

  const decrease = passed * 10;

  user.pet.hunger = Math.max(0, (user.pet.hunger ?? 100) - decrease);

  user.pet.lastHungerAt += passed * interval;

  saveUsers();
}

function isAdmin(userId) {
  return userId === ADMIN_ID;
}

function isRankingExcluded(userId) {
  return isAdmin(userId);
}

function normalizeComponentEmoji(emojiValue) {
  if (!emojiValue) return undefined;

  if (typeof emojiValue === "object") {
    if (emojiValue.id || emojiValue.name) {
      return {
        id: emojiValue.id ? String(emojiValue.id) : undefined,
        name: emojiValue.name || undefined,
        animated: Boolean(emojiValue.animated)
      };
    }
    return undefined;
  }

  if (typeof emojiValue !== "string") return undefined;

  const trimmed = emojiValue.trim();

  const customMatch = trimmed.match(/^<a?:([a-zA-Z0-9_]+):(\d+)>$/);
  if (customMatch) {
    return {
      name: customMatch[1],
      id: customMatch[2],
      animated: trimmed.startsWith("<a:")
    };
  }

  if (/^\d+$/.test(trimmed)) {
    return undefined;
  }

  return { name: trimmed };
}

function getBagItemMeta() {
  return {
    repairStone: {
      label: itemData?.repairStone?.name || "수리석",
      emoji: itemData?.repairStone?.emoji || "<:repair:1489875654886297640>",
      description:
        itemData?.repairStone?.description ||
        "무기 내구도를 수리할 때 사용하는 아이템입니다."
    },

    engraveStone: {
      label: itemData?.engraveStone?.name || "별의 각인",
      emoji: itemData?.engraveStone?.emoji || "💫",
      description:
        itemData?.engraveStone?.description ||
        "별의 각인에 사용되는 아이템입니다."
    },

    questionBox: {
      label: itemData?.questionBox?.name || "물음표박스",
      emoji: itemData?.questionBox?.emoji || "<:box:1492879878838816849>",
      description:
        itemData?.questionBox?.description ||
        "사용 시 랜덤 보상을 획득할 수 있습니다."
    },

    depositDoubleCoupon: {
      label: itemData?.depositDoubleCoupon?.name || "송금 더블 쿠폰",
      emoji: itemData?.depositDoubleCoupon?.emoji || "<:coupon:1496892441213665492>",
      description:
        itemData?.depositDoubleCoupon?.description ||
        "사용 시 선택한 유저의 남은 송금 횟수를 2배로 증가시킵니다."
    },

    randomTransferCoupon: {
      label: itemData?.randomTransferCoupon?.name || "송금 랜덤 쿠폰",
      emoji: itemData?.randomTransferCoupon?.emoji || "<:coupon2:1497620249766268938>",
      description:
        itemData?.randomTransferCoupon?.description ||
        "사용 시 선택한 유저의 송금 횟수를 랜덤으로 증가시킵니다."
    },

    wildGinsengPiece: {
      label: itemData?.wildGinsengPiece?.name || "산삼조각",
      emoji: itemData?.wildGinsengPiece?.emoji || "<:piece:1500337696525254658>",
      description:
        itemData?.wildGinsengPiece?.description ||
        "탐험을 통해 얻을 수 있는 희귀한 조각입니다."
    },

    petFood: {
      label: itemData?.petFood?.name || "펫먹이",
      emoji: itemData?.petFood?.emoji || "<:food:1501244821983989831>",
      description:
        itemData?.petFood?.description ||
        "사용 시 펫의 배고픔을 회복시킬 수 있습니다."
    }
  };
}

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const lottoResults = [
  {
    name: "**단독 당첨**",
    multiplier: 50,
    chance: 0.1,
    type: "win",
    effect:"배팅한 금액의 50배를 얻습니다.",
    message:
      "**1등 당첨도 말이 안 되는데… 나 혼자라니?! 상금을 전부 독차지하게 됐다밍!!!**"
  },

  {
    name: "**1등 당첨**",
    multiplier: 7,
    chance: 4.5,
    type: "win",
    effect:"배팅한 금액의 7배를 얻습니다.",
    message:
      "**드디어 1등에 당첨됐다밍!!! 이 짜릿한 순간 자체가 진짜 값지다밍!**"
  },

  {
    name: "**2등 당첨**",
    multiplier: 3,
    chance: 11,
    type: "win",
    effect:"배팅한 금액의 3배를 얻습니다.",
    message:
      "**숫자 1개 차이로 아쉽게 1등을 놓쳤다밍…! 그래도 이 정도면 운이 꽤 따라준 편이지!**"
  },

  {
    name: "**3등 당첨**",
    multiplier: 1,
    chance: 28.8,
    type: "win",
    effect:"배팅한 금액만큼 얻습니다.",
    message:
      "**3등에 당첨되었다밍!! 자랑할 정도는 아니지만, 은근히 뿌듯한 느낌이라 혼자 미소 짓게 된다밍**"
  },

  {
    name: "**4등 당첨**",
    multiplier: 0,
    chance: 7.3,
    type: "draw",
    effect: "아무 일도 일어나지 않았습니다.",
    message:
      "**아슬아슬하게 4등에 걸쳤다밍! 그래도 잃지 않은 게 어디야**"
  },

  {
    name: "**낙첨**",
    multiplier: -1,
    chance: 28.3,
    type: "lose",
    effect: "배팅한 금액만큼 잃습니다.",
    message:
      "**내가 고른 번호가 전부 빗나갔다밍..ㅠ 그래도 이런 날도 있어야 다음에 크게 터지는 거 아니겠어?!**"
  },

  {
    name: "**소매치기 등장**",
    multiplier: -3,
    chance: 14,
    type: "lose",
    effect: "배팅한 금액의 3배를 잃습니다.",
    message:
      "**로또를 구매하고 집에 가려는데 소매치기 당해 로또용지를 날렸다밍 결과를 알 수 없다니 ㅠㅠ**"
  },

  {
    name: "**로또용지 분실**",
    multiplier: -7,
    chance: 6,
    type: "lose",
    effect: "배팅한 금액의 7배를 잃습니다.",
    message:
      "**로또 결과를 확인했는데… 번호가 전부 맞았다밍?! 근데 아무리 찾아봐도 로또용지가 안 보인다밍…**"
  }
];

function getLottoResult() {
  const rand = Math.random() * 100;

  let cumulative = 0;

  for (const result of lottoResults) {
    cumulative += result.chance;

    if (rand < cumulative) {
      return result;
    }
  }

  return lottoResults[lottoResults.length - 1];
}

const fishingResults = [
  {
    name: "**낚시 실패**",
    multiplier: -7,
    chance: 4.5,
    type: "lose",
    effect: "배팅한 금액의 7배를 잃습니다.",
    image: "./assets/fishing/fail1.png",
    message: "**하루 종일 낚싯바늘만 바닥에 걸려 아무것도 낚지 못했다밍… 오늘 낚시는 완전히 공쳤다밍… 배팅액의 7배인 {amount}원을 잃었다밍ㅠ**"
  },
  {
    name: "**낚시 실패**",
    multiplier: -3,
    chance: 19,
    type: "lose",
    effect: "배팅한 금액의 3배를 잃습니다.",
    image: "./assets/fishing/fail2.png",
    message: "**엄청난 물고기가 걸린 줄 알았지만 끝내 낚싯줄이 끊어져버렸다밍… 배팅액의 3배인 {amount}원을 잃었다밍…**"
  },
  {
    name: "**낚시 실패**",
    multiplier: -1,
    chance: 25,
    type: "lose",
    effect: "배팅한 금액만큼 잃습니다.",
    image: "./assets/fishing/fail3.png",
    message: "**물고기들이 미끼만 쏙 빼먹고 전부 도망가버렸다밍… 결국 미끼값만 잔뜩 날려버렸다밍… 배팅금액인 {amount}원을 잃었다밍…**"
  },
  {
    name: "**낚시 성공**",
    multiplier: 1,
    chance: 24,
    type: "win",
    effect: "배팅한 금액만큼 얻습니다.",
    image: "./assets/fishing/success1.png",
    message: "**소소하게 갈치 한 마리를 낚아올렸다밍! 보상으로 배팅금액인 {amount}원을 얻었다밍!**"
  },
  {
    name: "**낚시 성공**",
    multiplier: 3,
    chance: 18,
    type: "win",
    effect: "배팅한 금액의 3배를 얻습니다.",
    image: "./assets/fishing/success2.png",
    message: "**상태 좋아 보이는 광어를 낚아올렸다밍! 보상으로 배팅액의 3배인 {amount}원을 얻었다밍!**"
  },
  {
    name: "**낚시 성공**",
    multiplier: 4,
    chance: 6.5,
    type: "win",
    effect: "배팅한 금액의 4배를 얻습니다.",
    image: "./assets/fishing/success3.png",
    message: "**제법 쏠쏠한 수확이다밍! 큼직한 돌돔을 낚아올렸다밍! 이 정도면 꽤 만족할 만한 결과다밍! 보상으로 배팅액의 4배인 {amount}원을 얻었다밍!**"
  },
  {
    name: "**낚시 성공**",
    multiplier: 7,
    chance: 2.95,
    type: "win",
    effect: "배팅한 금액의 7배를 얻습니다.",
    image: "./assets/fishing/success4.png",
    message: "**수면이 요동치더니… 대왕오징어 등장! 이 정도면 오늘은 끝내도 될 수준이다밍! 보상으로 배팅액의 7배인 {amount}원을 얻었다밍!**"
  },
  {
    name: "**낚시 성공**",
    multiplier: 30,
    chance: 0.05,
    type: "win",
    effect: "배팅한 금액의 30배를 얻습니다.",
    image: "./assets/fishing/success5.png",
    message: "**전설로만 듣던 블루마린을 낚아올렸다밍!! 평생 한 번 있을까 말까 한 순간이다밍… 보상으로 배팅액의 30배인 {amount}원을 얻었다밍!!! 오늘 운이 엄청 좋은 것 같다밍!**"
  }
];

function getFishingResult() {
  const rand = Math.random() * 100;

  let cumulative = 0;

  for (const result of fishingResults) {
    cumulative += result.chance;

    if (rand < cumulative) {
      return result;
    }
  }

  return fishingResults[fishingResults.length - 1];
}

/* ================= 배그 ================= */
const gambleTiers = [
  {
    name: "언랭",
    multiplier: -7,
    chance: 5,
    icon: "https://cdn.discordapp.com/emojis/1481642730059858112.png?size=512",
    bg: "./assets/pubg/unrank.png",
    color: "#9CA3AF",
    message: "언랭은 배팅한 금액의 7배를 잃습니다."
  },
  {
    name: "브론즈",
    multiplier: -3,
    chance: 20,
    icon: "https://cdn.discordapp.com/emojis/1481642775333306451.png?size=512",
    bg: "./assets/pubg/bronze.png",
    color: "#CD7F32",
    message: "브론즈는 배팅한 금액의 3배를 잃습니다."
  },
  {
    name: "실버",
    multiplier: -1,
    chance: 30,
    icon: "https://cdn.discordapp.com/emojis/1481642811689533520.png?size=512",
    bg: "./assets/pubg/silver.png",
    color: "#C0C0C0",
    message: "실버는 배팅한 금액만큼 잃습니다."
  },
  {
    name: "골드",
    multiplier: 1,
    chance: 32.3,
    icon: "https://cdn.discordapp.com/emojis/1481642850545307771.png?size=512",
    bg: "./assets/pubg/gold.png",
    color: "#FFD700",
    message: "골드는 배팅한 금액만큼 얻습니다."
  },
  {
    name: "플래티넘",
    multiplier: 3,
    chance: 9.5,
    icon: "https://cdn.discordapp.com/emojis/1481642886864044152.png?size=512",
    bg: "./assets/pubg/platinum.png",
    color: "#00C896",
    message: "플래티넘은 배팅한 금액의 3배를 얻습니다."
  },
  {
    name: "크리스탈",
    multiplier: 7,
    chance: 3.8,
    icon: "https://cdn.discordapp.com/emojis/1481642989267849397.png?size=512",
    bg: "./assets/pubg/crystal.png",
    color: "#5DADE2",
    message: "크리스탈은 배팅한 금액의 7배를 얻습니다."
  },
  {
    name: "다이아",
    multiplier: 30,
    chance: 0.34,
    icon: "https://cdn.discordapp.com/emojis/1481643036810149908.png?size=512",
    bg: "./assets/pubg/diamond.png",
    color: "#3B82F6",
    message: "다이아는 배팅한 금액의 30배를 얻습니다."
  },
  {
    name: "마스터",
    multiplier: 60,
    chance: 0.04,
    icon: "https://cdn.discordapp.com/emojis/1481643064119525488.png?size=512",
    bg: "./assets/pubg/master.png",
    color: "#8B5CF6",
    message: "마스터는 배팅한 금액의 60배를 얻습니다."
  },
  {
    name: "서바이버",
    multiplier: 100,
    chance: 0.02,
    icon: "https://cdn.discordapp.com/emojis/1481643092326088725.png?size=512",
    bg: "./assets/pubg/survivor.png",
    color: "#EF4444",
    message: "서바이버는 배팅한 금액의 100배를 얻습니다."
  }
];

function getRandomPubgTier() {
  const roll = Math.random() * 100;
  let cumulative = 0;

  for (const tier of gambleTiers) {
    cumulative += tier.chance;
    if (roll <= cumulative) {
      return tier;
    }
  }

  return gambleTiers[gambleTiers.length - 1];
}

async function safeLoadImage(src, label) {
  try {
    const finalPath =
      src.startsWith("http://") || src.startsWith("https://")
        ? src
        : path.join(__dirname, src);

    return await loadImage(finalPath);
  } catch (err) {
    console.error(`[배그 이미지 로드 실패] ${label}: ${src}`);
    throw err;
  }
}

function roundRect(ctx, x, y, width, height, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

function wrapText(ctx, text, x, y, maxWidth, lineHeight) {
  const words = text.split(" ");
  let line = "";
  let currentY = y;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i] + " ";
    const width = ctx.measureText(testLine).width;

    if (width > maxWidth && i > 0) {
      ctx.fillText(line, x, currentY);
      line = words[i] + " ";
      currentY += lineHeight;
    } else {
      line = testLine;
    }
  }

  ctx.fillText(line, x, currentY);
}

async function drawPubgResultImage({
  tierName,
  resultText,
  moneyText,
  gainText,
  money,  
  gain,  
  username,
  iconUrl,
  bgUrl,
  messageText
}) {
  const canvas = createCanvas(1280, 720);
  const ctx = canvas.getContext("2d");

  const bg = await safeLoadImage(bgUrl, `${tierName} 배경`);
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  const tierImage = await safeLoadImage(iconUrl, `${tierName} 아이콘`);

  // 🔥 아이콘 크기 줄이고 선명도 유지
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(tierImage, 95, 210, 300, 300);

  ctx.textBaseline = "top";

  // 🔥 공통 그림자 (가독성)
  ctx.shadowColor = "rgba(0, 0, 0, 0.75)";
  ctx.shadowBlur = 8;
  ctx.shadowOffsetX = 2;
  ctx.shadowOffsetY = 2;

  /* ================= 텍스트 ================= */

  // 제목
  ctx.fillStyle = "#FFFFFF";
  ctx.font = "bold 45px 'SUIT Bold'";
  ctx.fillText("배그 경쟁전 결과", 470, 78);

  // 티어명 (테두리 + 채우기)
ctx.font = "bold 70px 'SUIT Bold'";

// 🔥 가운데 정렬
ctx.textAlign = "center";

// 🔥 아이콘 아래 위치
const iconX = 95;
const iconY = 210;
const iconW = 300;
const iconH = 300;

const centerX = iconX + iconW / 2;   // 245
const belowY = iconY + iconH + 40;  // 530 근처

ctx.lineWidth = 4;
ctx.strokeStyle = "rgba(0,0,0,0.7)";
ctx.strokeText(tierName, centerX, belowY);

ctx.fillStyle = "#F3F4F6";
ctx.fillText(tierName, centerX - 10, belowY);

// 🔥 다시 원래로 (중요)
ctx.textAlign = "left";

  // 결과 문장
  ctx.font = "600 47px 'SUIT Bold'";
  ctx.fillStyle = "#F9FAFB";
  drawMultilineText(
  ctx,
  `${username}님의 경쟁전 결과는 ${tierName}입니다.`,
  455,
  280,
  800,
  60
);

  // 잔액
const balanceY = 430;
ctx.font = "42px 'SUIT Bold'";
ctx.fillStyle = "#E5E7EB";
ctx.fillText("잔액:", 455, 430);

ctx.font = "42px 'SUIT Bold'";
ctx.fillStyle = "#E5E7EB";
drawBalanceText(ctx, money, gain, balanceY, 555);

// 🔥 티어 설명
ctx.font = "28px 'SUIT Bold'";
ctx.fillStyle = "#D1D5DB";
ctx.fillText(messageText, 455, 590);

return canvas.toBuffer("image/png");
}

async function drawPetInfoImage(user) {
  const canvas = createCanvas(800, 1000);
  const ctx = canvas.getContext("2d");

  // 배경
  const bg = await loadImage("./assets/pet-info-bg.png");
  ctx.drawImage(bg, 0, 0, canvas.width, canvas.height);

  // 펫 정보 가져오기
  const pet = getPetByKey(user.pet?.key);

  // 펫 이미지
  if (pet && pet.image) {
    const petImg = await loadImage(pet.image);

    const maxWidth = 600;
    const maxHeight = 350;

    const ratio = Math.min(
      maxWidth / petImg.width,
      maxHeight / petImg.height
    );

    const width = petImg.width * ratio;
    const height = petImg.height * ratio;

    const x = 100 + (maxWidth - width) / 2;
    const y = 200 + (maxHeight - height) / 2;

    ctx.drawImage(petImg, x, y, width, height);
  }

  // 텍스트 설정
  ctx.textAlign = "left";
  ctx.textBaseline = "top";
  ctx.fillStyle = "#5B3A1E";
  ctx.font = "bold 34px 'SUIT Bold'";

  const petName = pet ? pet.nickname || pet.name : "없음";
  const petLevel = user.pet?.level || 1;

  // 이름 / 레벨
  ctx.fillText(petName, 230, 675);
  ctx.fillText(`Lv.${petLevel}`, 560, 675);

 // 배고픔
const hunger = user.pet?.hunger ?? 100;
const filled = Math.floor(hunger / 10);

// 위치 (요청한 좌표)
const startX = 240;
const startY = 765;

// 길쭉한 바 설정
const barWidth = 320;
const barHeight = 30;
const cellWidth = barWidth / 10;

// 전체 배경
ctx.fillStyle = "#FFF7ED";
ctx.fillRect(startX, startY, barWidth, barHeight);

// 채워진 부분
ctx.fillStyle = "#FDE68A";
ctx.fillRect(startX, startY, cellWidth * filled, barHeight);

// 테두리
ctx.strokeStyle = "#8B5A1E";
ctx.lineWidth = 3;
ctx.strokeRect(startX, startY, barWidth, barHeight);

// 점선 칸 구분
ctx.strokeStyle = "rgba(139, 90, 30, 0.7)";
ctx.lineWidth = 2;
ctx.setLineDash([4, 4]);

for (let i = 1; i < 10; i++) {
  const x = startX + cellWidth * i;
  ctx.beginPath();
  ctx.moveTo(x, startY);
  ctx.lineTo(x, startY + barHeight);
  ctx.stroke();
}

ctx.setLineDash([]);

// 퍼센트 텍스트
ctx.font = "bold 28px 'SUIT Bold'";
ctx.fillStyle = "#5B3A1E";
ctx.fillText(`${hunger}%`, startX + barWidth + 15, startY - 2);

  // 옵션
  ctx.font = "bold 28px 'SUIT Bold'";
  ctx.fillStyle = "#5B3A1E";

  let optionText = "옵션 없음";

  if (pet?.option?.type) {
    // D등급
    if (pet.option.type === "attendanceDouble") {
      optionText = "일일 출석시 얻는 금액 2배";
    } else if (pet.option.type === "farmCafeFailReduce") {
      optionText = "농사/카페 실패 확률 2% 감소";
    } else if (pet.option.type === "lottoSuccessChance") {
      optionText = "복권 성공 확률 20% 증가";
    }

    // C등급
    else if (pet.option.type === "topLootChance") {
      optionText = "최상급 전리품 당첨 확률 5%";
    } else if (pet.option.type === "exploreRepairChance") {
      optionText = "수리석 등장 확률 0.2%";
    } else if (pet.option.type === "cafeMoneyDouble") {
      optionText = "카페로 얻는 금액 30% 확률로 2배";
    }

    // B등급
    else if (pet.option.type === "cooldownReduce") {
      optionText = "경험치 제외 쿨타임 20% 감소";
    } else if (pet.option.type === "upgradeDiscount") {
      optionText = "강화 비용 5% 할인";
    } else if (pet.option.type === "bankruptcyIgnoreFail") {
      optionText = "50% 확률로 파산신청시 거절 방지";
    }
  }

  ctx.fillText(optionText, 230, 870);

  return canvas.toBuffer("image/png");
}

async function drawInfoImage(interaction, user, displayUser = interaction.user) {
  const background = await loadImage(
    path.join(__dirname, "assets", "info", "base.png")
  );

  const canvas = createCanvas(background.width, background.height);
  const ctx = canvas.getContext("2d");

  // 배경 원본 비율 그대로
  ctx.drawImage(background, 0, 0);

// =========================
// 유저 프로필 사진
// =========================
const avatar = await loadImage(
  displayUser.displayAvatarURL({
    extension: "png",
    size: 256
  })
);

ctx.save();
ctx.beginPath();

// 동그라미 중심 x, y, 반지름
ctx.arc(235, 185, 115, 0, Math.PI * 2);
ctx.closePath();
ctx.clip();

// 이미지 위치 x, y, 크기
ctx.drawImage(avatar, 120, 70, 230, 230);

ctx.restore();

// =========================
// 유저 아이디
// =========================

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 55px 'Ssurround'";

ctx.fillText(
  displayUser.username,
  400,
  130
);

  // =========================
// 돈 순위
// =========================

const sortedMoneyUsers = Object.entries(users)
  .filter(([userId]) => !isRankingExcluded(userId))
  .sort((a, b) => (b[1].money || 0) - (a[1].money || 0));

const rankIndex = sortedMoneyUsers.findIndex(
  ([userId]) => userId === displayUser.id
);
const moneyRank = rankIndex === -1 ? "순위 없음" : `${rankIndex + 1}위`;

let rankIcon = "";

if (rankIndex === 0) rankIcon = "🥇 ";
else if (rankIndex === 1) rankIcon = "🥈 ";
else if (rankIndex === 2) rankIcon = "🥉 ";

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 36px 'Ssurround'";

ctx.fillText(
  `${rankIcon}순위 ${moneyRank}`,
  500,
  220
);

  // =========================
// 잔액
// =========================

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 50px 'Ssurround'";

ctx.fillText(
  `${user.money.toLocaleString()}원`,
  550,
  300
);

// =========================
// 출석일수
// =========================

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 34px 'Ssurround'";

ctx.textAlign = "center";

ctx.fillText(
  `${user.attendanceDays.toLocaleString()}일`,
  360,
  445
);

ctx.textAlign = "left";

// =========================
// 송금 횟수
// =========================

resetDailyTransferLimit(user);

const remainingTransfer =
  user.transfer.maxCount - user.transfer.usedCount;

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 34px 'Ssurround'";

ctx.fillText(
  `${remainingTransfer}회`,
  700,
  445
);

// =========================
// 농사 레벨 아이콘
// =========================

const farmLevelIcon = await loadImage(
  path.join(
    __dirname,
    "assets",
    "info",
    "level",
    `${user.farmLevel}.png`
  )
);

ctx.drawImage(
  farmLevelIcon,
  1050, // x
  400, // y
  65,  // width
  65   // height
);

// =========================
// 농사 경험치
// =========================

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 34px 'Ssurround'";

ctx.textAlign = "center";

ctx.fillText(
  `${user.farmExp}`,
  990,
  520
);

ctx.textAlign = "left";

// =========================
// 카페 레벨 아이콘
// =========================

const cafeLevelIcon = await loadImage(
  path.join(
    __dirname,
    "assets",
    "info",
    "level",
    `${user.gatherLevel}.png`
  )
);

ctx.drawImage(
  cafeLevelIcon,
  1380, // x
  400,  // y
  65,  // width
  65   // height
);

// =========================
// 카페 경험치
// =========================

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 34px 'Ssurround'";

// 가운데 정렬
ctx.textAlign = "center";

ctx.fillText(
  `${user.gatherExp}`,
  1330,
  520
);

// 다시 원래대로
ctx.textAlign = "left";

// =========================
// 복숭아 보유량
// =========================

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 30px 'Ssurround'";

// 가운데 정렬
ctx.textAlign = "center";

ctx.fillText(
  `${user.farmCrops.peach.toLocaleString()}`,
  140,
  800
);

// 다시 원래대로
ctx.textAlign = "left";

// =========================
// 딸기 보유량
// =========================

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 30px 'Ssurround'";
ctx.textAlign = "center";

ctx.fillText(
  `${user.farmCrops.strawberry.toLocaleString()}`,
  295,
  800
);

// =========================
// 샤인머스켓 보유량
// =========================

ctx.fillText(
  `${user.farmCrops.shineMuscat.toLocaleString()}`,
  450,
  800
);

// =========================
// 사과 보유량
// =========================

ctx.fillText(
  `${user.farmCrops.apple.toLocaleString()}`,
  605,
  800
);

// =========================
// 산삼 보유량
// =========================

ctx.fillText(
  `${user.farmCrops.wildGinseng.toLocaleString()}`,
  755,
  800
);

ctx.textAlign = "left";

// =========================
// 무기 정보
// =========================

const weaponData = gameData.weapons["Lv" + user.level];

// 무기 이름
ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 32px 'Ssurround'";


ctx.fillText(
  `Lv.${user.level} [${weaponData.name}]`,
  1040,
  755
);

// 내구도
ctx.font = "bold 30px 'Ssurround'";

ctx.fillText(
  `내구도 : ${user.durability}`,
  1040,
  800
);

// =========================
// 별의 각인
// =========================

const blueStars = Math.floor(user.engraveLevel / 10);
const pinkStars = Math.floor((user.engraveLevel % 10) / 5);
const yellowStars = user.engraveLevel % 5;

const blueStarImg = await loadImage(
  path.join(__dirname, "assets", "info", "star", "10.png")
);

const pinkStarImg = await loadImage(
  path.join(__dirname, "assets", "info", "star", "5.png")
);

const yellowStarImg = await loadImage(
  path.join(__dirname, "assets", "info", "star", "1.png")
);

// 시작 위치
let starX = 1020;
const starY = 865;

// 별 크기
const starSize = 50;

// 파란별
for (let i = 0; i < blueStars; i++) {
  ctx.drawImage(
    blueStarImg,
    starX,
    starY,
    starSize,
    starSize
  );

  starX += 55;
}

// 분홍별
for (let i = 0; i < pinkStars; i++) {
  ctx.drawImage(
    pinkStarImg,
    starX,
    starY,
    starSize,
    starSize
  );

  starX += 55;
}

// 노란별
for (let i = 0; i < yellowStars; i++) {
  ctx.drawImage(
    yellowStarImg,
    starX,
    starY,
    starSize,
    starSize
  );

  starX += 55;
}

// =========================
// 가입일
// =========================

ctx.fillStyle = "#3B1D0F";
ctx.font = "bold 32px 'Ssurround'";
ctx.textAlign = "center";

ctx.fillText(
  `${user.joinDate}`,
  450,
  920
);

ctx.textAlign = "left";

  return canvas.toBuffer("image/png");
}

client.once("ready", () => {
  console.log(`${client.user.tag} 로그인 완료`);
});

client.on("interactionCreate", async interaction => {
    logCommandUse(interaction);

  /* ---------------- 쿠폰 모달 제출 ---------------- */
if (interaction.isModalSubmit() && interaction.customId === "coupon_use_modal") {
  const code = interaction.fields
  .getTextInputValue("coupon_code")
  .trim()
  .toUpperCase();;
  const id = interaction.user.id;
  const user = ensureUser(id);

  const coupon = coupons[code];

  if (!coupon) {
    return interaction.reply({
      content: "❌ 존재하지 않는 쿠폰 코드입니다.",
      ephemeral: true
    });
  }

  if (coupon.expireAt && Date.now() > coupon.expireAt) {
    return interaction.reply({
      content: "❌ 만료된 쿠폰입니다.",
      ephemeral: true
    });
  }

  if (coupon.usedCount >= coupon.maxUse) {
    return interaction.reply({
      content: "❌ 이미 모두 사용된 쿠폰입니다.",
      ephemeral: true
    });
  }

  if (coupon.usedBy.includes(id)) {
    return interaction.reply({
      content: "❌ 이미 사용한 쿠폰입니다.",
      ephemeral: true
    });
  }

  const itemMap = {
    repairStone: { name: "수리석", emoji: "<:repair:1489875654886297640>" },
    engraveStone: { name: "별의 각인", emoji: "💫" },
    questionBox: { name: "물음표박스", emoji: "<:box:1492879878838816849>" },
    depositDoubleCoupon: { name: "송금 더블 쿠폰", emoji: "<:coupon:1496892441213665492>" },
    randomTransferCoupon: { name: "송금 랜덤 쿠폰", emoji: "<:coupon2:1497620249766268938>" },
    wildGinsengPiece: { name: "산삼조각", emoji: "<:piece:1500337696525254658>" },
  };

  const cropMap = {
    peach: { name: "복숭아", emoji: "🍑" },
    strawberry: { name: "딸기", emoji: "🍓" },
    shineMuscat: { name: "샤인머스켓", emoji: "<:grape:1489872445555867759>" },
    apple: { name: "사과", emoji: "🍎" },
    wildGinseng: { name: "산삼", emoji: "<:wildGinseng:1489948179615977553>" }
  };

  let rewardText = "";

  if (coupon.type === "money") {
    user.money += coupon.amount;

    rewardText =
`<:money:1489876006893518968> ${coupon.amount.toLocaleString()}원을 지급받았다밍!

<:money:1489876006893518968> 잔액: ${user.money.toLocaleString()}원`;
  }

  else if (coupon.type === "item") {
    const item = itemMap[coupon.key];

    if (!item) {
      return interaction.reply({
        content: "❌ 쿠폰 아이템 데이터가 올바르지 않습니다.",
        ephemeral: true
      });
    }

    if (!user.inventory) user.inventory = {};
    if (user.inventory[coupon.key] === undefined) user.inventory[coupon.key] = 0;

    user.inventory[coupon.key] += coupon.amount;

    rewardText =
`${item.emoji} ${item.name} ${coupon.amount.toLocaleString()}개를 지급받았다밍!

${item.emoji} 보유 개수: ${user.inventory[coupon.key].toLocaleString()}개`;
  }

  else if (coupon.type === "crop") {
    const crop = cropMap[coupon.key];

    if (!crop) {
      return interaction.reply({
        content: "❌ 쿠폰 작물 데이터가 올바르지 않습니다.",
        ephemeral: true
      });
    }

    if (!user.farmCrops) user.farmCrops = {};
    if (user.farmCrops[coupon.key] === undefined) user.farmCrops[coupon.key] = 0;

    user.farmCrops[coupon.key] += coupon.amount;

    rewardText =
`${crop.emoji} ${crop.name} ${coupon.amount.toLocaleString()}개를 지급받았다밍!

${crop.emoji} 보유 개수: ${user.farmCrops[coupon.key].toLocaleString()}개`;
  }

  else {
    return interaction.reply({
      content: "❌ 쿠폰 종류가 올바르지 않습니다.",
      ephemeral: true
    });
  }

  coupon.usedCount += 1;
  coupon.usedBy.push(id);

  const remainingCouponUse = coupon.maxUse - coupon.usedCount;

  saveUsers();
  saveCoupons();

  const embed = new EmbedBuilder()
    .setColor("#6366f1")
    .setTitle("쿠폰 사용 완료")
    .setDescription(
      `${rewardText}

    남은 쿠폰 개수: ${remainingCouponUse.toLocaleString()}회`
  );

  return interaction.reply({
    embeds: [embed],
  });
}

/* ---------------- 버튼 ---------------- */
if (interaction.isButton()) {

  const ownerId = interaction.message.interaction?.user?.id;
  const yutButtonIds = ["yut_accept", "yut_decline", "yut_roll", "yut_piece_0", "yut_piece_1"];

  const id = interaction.customId;

  if (yutButtonIds.includes(id)) {
    if (!yutEnabled) {
      return interaction.reply({
        content: "❌ 현재 윷놀이가 비활성화 상태입니다.",
        ephemeral: true
      });
    }

  if (YUT_CHANNEL_IDS.length > 0 && !YUT_CHANNEL_IDS.includes(interaction.channel.id)) {
    return interaction.reply({
      content: "❌ 이 채널에서는 윷놀이를 사용할 수 없습니다.",
      ephemeral: true
    });
  }
}

  // 소유자 제한
if (!yutButtonIds.includes(id)) {
  if (ownerId && interaction.user.id !== ownerId) {
    return interaction.reply({
      content: "이 버튼은 명령어를 실행한 사람만 사용할 수 있습니다.",
      ephemeral: true
    });
  }
}

  /* ---------------- stop 버튼 ---------------- */
if (interaction.customId === "stop") {
  const id = interaction.user.id;

  activeInteractions.delete(id);

  const upgradeCollector = upgradeCollectors.get(id);
  if (upgradeCollector) {
    upgradeCollector.stop("stopped");
  }
  upgradeCollectors.delete(id);

  const engraveCollector = engraveCollectors.get(id);
  if (engraveCollector) {
    engraveCollector.stop("stopped");
  }
  engraveCollectors.delete(id);

  const oldEmbed = interaction.message.embeds[0];

  const oldDescription =
    oldEmbed.description ||
    oldEmbed.data?.description ||
    "";

  const newDescription = oldDescription
    .split("\n")
    .filter(line => !line.includes("1분 동안 작동"))
    .join("\n")
    .trim();

  const stoppedEmbed = EmbedBuilder.from(oldEmbed)
    .setDescription(newDescription);

  return interaction.update({
    embeds: [stoppedEmbed],
    components: [],
    content: null
  });

  return;
 }

    /* ---------------- 탈퇴 취소 버튼 ---------------- */
    if (interaction.customId === "withdraw_cancel") {
      return interaction.update({
        content: "탈퇴가 취소되었습니다.",
        embeds: [],
        components: []
      });
    }

    /* ---------------- 탈퇴 확인 버튼 ---------------- */
    if (interaction.customId === "withdraw_confirm") {
      const id = interaction.user.id;

      if (!users[id]) {
        return interaction.reply({
          content: "❌ 이미 탈퇴했거나 가입 정보가 없습니다.",
          ephemeral: true
        });
      }

      const user = ensureUser(id);

      if (user.money < 0) {
        return interaction.reply({
          content: "❌ 보유 금액이 마이너스면 탈퇴할 수 없습니다.",
          ephemeral: true
        });
      }

      delete users[id];
      saveUsers();

      const embed = new EmbedBuilder()
        .setColor("#57F287")
        .setTitle("탈퇴 완료")
        .setDescription("계정이 정상적으로 삭제되었습니다.");

      return interaction.update({
        embeds: [embed],
        components: [],
        content: null
      });
    }

   if (interaction.customId === "open_questionBox") {
  const id = interaction.user.id;
  const user = ensureUser(id);

  if (!user.inventory.questionBox || user.inventory.questionBox <= 0) {
    return interaction.reply({
      content: "❌ 물음표박스가 없습니다.",
      ephemeral: true
    });
  }

  // 상자 차감
  user.inventory.questionBox -= 1;

  // 랜덤 보상
  const result = openQuestionBox();

  // 보상 지급
  if (result.type === "money") user.money += result.value;
  if (result.type === "repair") user.inventory.repairStone += result.value;
  if (result.type === "peach") user.farmCrops.peach += result.value;
  if (result.type === "strawberry") user.farmCrops.strawberry += result.value;
  if (result.type === "shineMuscat") user.farmCrops.shineMuscat += result.value;
  if (result.type === "apple") user.farmCrops.apple += result.value;
  if (result.type === "farmExp") user.farmExp += result.value;
  if (result.type === "gatherExp") user.gatherExp += result.value;
  if (result.type === "randomTransferCoupon") user.inventory.randomTransferCoupon += result.value;
  if (result.type === "depositDoubleCoupon") user.inventory.depositDoubleCoupon += result.value;

  let rewardStatusText = "";

if (result.type === "money") {
  rewardStatusText = `<:money:1489876006893518968> 잔액: ${user.money.toLocaleString()}원 (+${result.value.toLocaleString()}원)`;
}

if (result.type === "repair") {
  rewardStatusText = `<:repair:1489875654886297640> ${user.inventory.repairStone.toLocaleString()}개 (+${result.value.toLocaleString()}개)`;
}

if (result.type === "peach") {
  rewardStatusText = `🍑 ${user.farmCrops.peach.toLocaleString()}개 (+${result.value.toLocaleString()}개)`;
}

if (result.type === "strawberry") {
  rewardStatusText = `🍓 ${user.farmCrops.strawberry.toLocaleString()}개 (+${result.value.toLocaleString()}개)`;
}

if (result.type === "shineMuscat") {
  rewardStatusText = `<:grape:1489872445555867759> ${user.farmCrops.shineMuscat.toLocaleString()}개 (+${result.value.toLocaleString()}개)`;
}

if (result.type === "apple") {
  rewardStatusText = `🍎 ${user.farmCrops.apple.toLocaleString()}개 (+${result.value.toLocaleString()}개)`;
}

if (result.type === "farmExp") {
  rewardStatusText = `농사 경험치: ${user.farmExp.toLocaleString()} (+${result.value.toLocaleString()})`;
}

if (result.type === "gatherExp") {
  rewardStatusText = `카페 경험치: ${user.gatherExp.toLocaleString()} (+${result.value.toLocaleString()})`;
}

if (result.type === "randomTransferCoupon") {
  rewardStatusText = `<:coupon2:1497620249766268938> ${user.inventory.randomTransferCoupon.toLocaleString()}개 (+${result.value.toLocaleString()}개)`;
}

if (result.type === "depositDoubleCoupon") {
  rewardStatusText = `<:coupon:1496892441213665492> ${user.inventory.depositDoubleCoupon.toLocaleString()}개 (+${result.value.toLocaleString()}개)`;
}

  saveUsers();

  return interaction.update({
    embeds: [
      new EmbedBuilder()
        .setColor("#22c55e")
        .setTitle("<:box:1492879878838816849> 물음표박스 결과")
        .setDescription(

`${result.text}

${rewardStatusText}
남은 상자 개수 : ${user.inventory.questionBox}개`
        )
    ],
    components: []
  });
}

/* ---------------- 윷대결 수락 ---------------- */
if (interaction.customId === "yut_accept") {
  const game = getYutGame(interaction.channel.id);

  if (!game) {
    return interaction.reply({
      content: "❌ 진행 중인 윷대결 신청이 없습니다.",
      ephemeral: true
    });
  }

  if (game.started || game.finished) {
    return interaction.reply({
      content: "❌ 이미 시작되었거나 종료된 게임입니다.",
      ephemeral: true
    });
  }

  if (!isYutPlayer(game, interaction.user.id)) {
    return interaction.reply({
      content: "❌ 이 윷대결의 참가자만 수락할 수 있습니다.",
      ephemeral: true
    });
  }

  if (game.acceptedBy.includes(interaction.user.id)) {
    return interaction.reply({
      content: "❌ 이미 수락했습니다.",
      ephemeral: true
    });
  }

  game.acceptedBy.push(interaction.user.id);

  if (game.acceptedBy.length < 2) {
    const waitingUserId =
      game.player1.id === interaction.user.id ? game.player2.id : game.player1.id;

    const embed = new EmbedBuilder()
      .setColor("#E5E7EB")
      .setTitle("윷놀이 대결 신청")
      .setDescription(
`<@${interaction.user.id}>님이 대결을 수락했습니다.

남은 대기 인원: <@${waitingUserId}>

두 플레이어가 모두 수락하면 게임이 시작됩니다.`
      );

    return interaction.update({
      embeds: [embed],
      components: interaction.message.components,
      allowedMentions: { parse: [] }
    });
  }

  game.waitingForAccept = false;
  game.started = true;
  game.turn = Math.random() < 0.5 ? game.player1.id : game.player2.id;

  const rollButton = new ButtonBuilder()
    .setCustomId("yut_roll")
    .setLabel("윷 던지기")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(rollButton);

  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("윷놀이 시작")
    .setDescription(
`두 플레이어가 모두 수락하여 게임이 시작되었습니다.

선턴: <@${game.turn}>

규칙
- 말 2개씩 사용
- 상대 말을 잡으면 상대 말은 출발지점으로 돌아갑니다.
- 상대를 잡으면 한 번 더 던질 수 있습니다.
- 말 2개를 모두 완주하면 승리합니다.

<@${game.turn}>님의 턴입니다.
아래 버튼을 눌러 윷을 던져주세요.`
    );

  return interaction.update({
    embeds: [embed],
    components: [row],
    allowedMentions: { parse: [] }
  });
}

/* ---------------- 윷대결 거절 ---------------- */
if (interaction.customId === "yut_decline") {
  const game = getYutGame(interaction.channel.id);

  if (!game) {
    return interaction.reply({
      content: "❌ 진행 중인 윷놀이 대결 신청이 없습니다.",
      ephemeral: true
    });
  }

  if (!isYutPlayer(game, interaction.user.id)) {
    return interaction.reply({
      content: "❌ 이 윷놀이 대결의 참가자만 거절할 수 있습니다.",
      ephemeral: true
    });
  }

  deleteYutGame(interaction.channel.id);

  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("윷놀이 대결 거절")
    .setDescription(
`<@${interaction.user.id}>님이 윷놀이 대결을 거절했습니다.

대결 신청이 취소되었습니다.`
    );

  return interaction.update({
    embeds: [embed],
    components: [],
    allowedMentions: { parse: [] }
  });
}

/* ---------------- 윷 던지기 ---------------- */
if (interaction.customId === "yut_roll") {
  await interaction.deferUpdate();

  const game = getYutGame(interaction.channel.id);

  if (!game) return;
  if (!game.started || game.finished) return;
  if (!isYutPlayer(game, interaction.user.id)) return;
  if (game.turn !== interaction.user.id) return;
  if (game.pendingRoll !== null) return;

  const rollResult = rollYut();
  game.pendingRoll = rollResult.name;
  game.pendingSteps = rollResult.steps;

  const currentPlayer = getYutPlayer(game, interaction.user.id);
  const opponentPlayer = getYutOpponent(game, interaction.user.id);

  // 빽도인데 움직일 수 있는 말이 하나도 없으면 자동 턴 종료
  if (rollResult.steps === -1) {
    const movablePieces = currentPlayer.pieces.filter(
      pos => pos !== -1 && pos < YUT_BOARD_SIZE
    );

    if (movablePieces.length === 0) {
      game.pendingRoll = null;
      game.pendingSteps = 0;
      game.turn = opponentPlayer.id;

      const embed = new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("윷 던지기")
        .setDescription(
`<@${interaction.user.id}>님의 결과: **빽도** (-1칸)

현재 두 말이 모두 출발 전이라 이동할 수 없습니다.

이제 <@${game.turn}>님의 턴입니다.`
        );

      const buffer = await drawYutBoardTestPieces(interaction.channel.id);
      embed.setImage("attachment://yut-board.png");

      await interaction.message.edit({
        embeds: [embed],
        files: [{ attachment: buffer, name: "yut-board.png" }],
        components: [
          new ActionRowBuilder().addComponents(
            new ButtonBuilder()
              .setCustomId("yut_roll")
              .setLabel("윷 던지기")
              .setStyle(ButtonStyle.Primary)
          )
        ],
        allowedMentions: { parse: [] }
      });
      return;
    }
  }

  const piece0Pos = currentPlayer.pieces[0];
  const piece1Pos = currentPlayer.pieces[1];

  const piece0Movable =
    piece0Pos < YUT_BOARD_SIZE &&
    !(rollResult.steps === -1 && piece0Pos === -1);

  const piece1Movable =
    piece1Pos < YUT_BOARD_SIZE &&
    !(rollResult.steps === -1 && piece1Pos === -1);

  let row;

  // 업은 상태면 버튼 1개만 표시
  if (
    piece0Pos === piece1Pos &&
    piece0Pos >= 0 &&
    piece0Pos < YUT_BOARD_SIZE
  ) {
    const stackButton = new ButtonBuilder()
      .setCustomId("yut_piece_0")
      .setLabel("업은 말 이동")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!piece0Movable);

    row = new ActionRowBuilder().addComponents(stackButton);
  } else {
    const pieceButton1 = new ButtonBuilder()
      .setCustomId("yut_piece_0")
      .setLabel("말 1 이동")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!piece0Movable);

    const pieceButton2 = new ButtonBuilder()
      .setCustomId("yut_piece_1")
      .setLabel("말 2 이동")
      .setStyle(ButtonStyle.Primary)
      .setDisabled(!piece1Movable);

    row = new ActionRowBuilder().addComponents(pieceButton1, pieceButton2);
  }

  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("윷 던지기")
    .setDescription(
`<@${interaction.user.id}>님의 결과: **${rollResult.name}** (${rollResult.steps}칸)

<@${game.player1.id}>님의 말 상태
${getPieceStatusText(game.player1)}

<@${game.player2.id}>님의 말 상태
${getPieceStatusText(game.player2)}

이동할 말을 선택해주세요.`
    );

  const buffer = await drawYutBoardTestPieces(interaction.channel.id);
  embed.setImage("attachment://yut-board.png");

  await interaction.message.edit({
    embeds: [embed],
    files: [{ attachment: buffer, name: "yut-board.png" }],
    components: [row],
    allowedMentions: { parse: [] }
  });
  return;
}

/* ---------------- 윷 말 이동 ---------------- */
if (interaction.customId === "yut_piece_0" || interaction.customId === "yut_piece_1") {
  await interaction.deferUpdate();

  const game = getYutGame(interaction.channel.id);

  if (!game) return;
  if (!game.started || game.finished) return;
  if (!isYutPlayer(game, interaction.user.id)) return;
  if (game.turn !== interaction.user.id) return;
  if (!game.pendingSteps && game.pendingSteps !== -1) return;

  const pieceIndex = interaction.customId === "yut_piece_0" ? 0 : 1;

  const currentPlayer = getYutPlayer(game, interaction.user.id);
  const opponentPlayer = getYutOpponent(game, interaction.user.id);

  const rolledName = game.pendingRoll;
  const rolledSteps = game.pendingSteps;

  const moveResult = moveYutPiece(currentPlayer, pieceIndex, rolledSteps);

  if (!moveResult.moved) return;

  let caught = false;

  if (moveResult.newPos >= 0 && moveResult.newPos < YUT_BOARD_SIZE) {
    for (let i = 0; i < opponentPlayer.pieces.length; i++) {
      if (opponentPlayer.pieces[i] === moveResult.newPos) {
        opponentPlayer.pieces[i] = -1;
        caught = true;
      }
    }
  }

  if (currentPlayer.finishedCount >= 2) {
    game.finished = true;
    game.winner = interaction.user.id;
  }

  game.pendingRoll = null;
  game.pendingSteps = 0;

  let description = `<@${interaction.user.id}>님이 **${rolledName}** (${rolledSteps}칸) 결과로 말 ${pieceIndex + 1}을 이동했습니다.\n\n`;

description += `<@${game.player1.id}>님의 말 상태\n${getPieceStatusText(game.player1)}\n\n`;
description += `<@${game.player2.id}>님의 말 상태\n${getPieceStatusText(game.player2)}\n\n`;

  if (caught) {
    description += `상대 말을 잡았습니다!\n<@${interaction.user.id}>님이 한 번 더 던집니다.`;
  } else if (game.finished) {
    description += `🏆 <@${interaction.user.id}>님의 승리입니다!`;
  } else {
    game.turn = opponentPlayer.id;
    description += `이제 <@${game.turn}>님의 턴입니다.`;
  }

  const embed = new EmbedBuilder()
    .setColor(game.finished ? "#22c55e" : caught ? "#f59e0b" : "#5865F2")
    .setTitle(game.finished ? "윷놀이 종료" : "말 이동 완료")
    .setDescription(description);

  const buffer = await drawYutBoardTestPieces(interaction.channel.id);
  embed.setImage("attachment://yut-board.png");

  if (game.finished) {
    await interaction.message.edit({
      embeds: [embed],
      files: [{ attachment: buffer, name: "yut-board.png" }],
      components: [],
      allowedMentions: { parse: [] }
    });
    return;
  }

  const rollButton = new ButtonBuilder()
    .setCustomId("yut_roll")
    .setLabel("윷 던지기")
    .setStyle(ButtonStyle.Primary);

  const row = new ActionRowBuilder().addComponents(rollButton);

  await interaction.message.edit({
    embeds: [embed],
    files: [{ attachment: buffer, name: "yut-board.png" }],
    components: [row],
    allowedMentions: { parse: [] }
  });

  return;
}

/* ---------------- 가위바위보 버튼 ---------------- */
if (
  interaction.customId.startsWith("rps_scissors_") ||
  interaction.customId.startsWith("rps_rock_") ||
  interaction.customId.startsWith("rps_paper_")
) {
  const user = ensureUser(interaction.user.id);

  const parts = interaction.customId.split("_");

  const userChoice = parts[1];
  const amount = parseInt(parts[2]);

  // 🔥 결과 확률 설정
  const rand = Math.random() * 100;

  let resultType;

  if (rand < 35) {
    resultType = "win";
  } else if (rand < 70) {
    resultType = "lose";
  } else {
    resultType = "draw";
  }

  let botChoice;

  if (resultType === "win") {
    if (userChoice === "scissors") botChoice = "paper";
    else if (userChoice === "rock") botChoice = "scissors";
    else botChoice = "rock";
  } else if (resultType === "lose") {
    if (userChoice === "scissors") botChoice = "rock";
    else if (userChoice === "rock") botChoice = "paper";
    else botChoice = "scissors";
  } else {
    botChoice = userChoice;
  }

  const choiceNames = {
    scissors: "✌️",
    rock: "✊",
    paper: "✋"
  };

  let embed;
  let moneyChange = 0;

  // 🔥 승리
  if (resultType === "win") {
    moneyChange = amount * 3;

    user.money += moneyChange;

    embed = new EmbedBuilder()
      .setColor("#FFFFFF")
      .setTitle("짱깸뽀 결과")
      .setDescription(
`🐣 **내 선택:** ${choiceNames[userChoice]}
<:sheep:1502713987354198177> **미닝봇 선택:** ${choiceNames[botChoice]}

**아싸! 내가 미닝봇을 이겼다밍! 보상으로 배팅액의 3배인 ${moneyChange.toLocaleString()}원을 얻었다밍!!**

<:money:1489876006893518968> **잔액:** ${user.money.toLocaleString()}원 (+${moneyChange.toLocaleString()}원)`
      );
  }

  // 🔥 무승부
  else if (resultType === "draw") {
    moneyChange = 0;

    embed = new EmbedBuilder()
      .setColor("#9CA3AF")
      .setTitle("짱깸뽀 결과")
      .setDescription(
`🐣 **내 선택:** ${choiceNames[userChoice]}
<:sheep:1502713987354198177> **미닝봇 선택:** ${choiceNames[botChoice]}

**미닝봇과 비겼다밍! 아무 일도 일어나지 않았지만, 다음엔 꼭 이겨보자밍!**

<:money:1489876006893518968> **잔액:** ${user.money.toLocaleString()}원`
      );
  }

  // 🔥 패배
  else {
    moneyChange = amount * 3;

    user.money -= moneyChange;

    embed = new EmbedBuilder()
      .setColor("#000000")
      .setTitle("짱깸뽀 결과")
      .setDescription(
`🐣 **내 선택:** ${choiceNames[userChoice]}
<:sheep:1502713987354198177> **미닝봇 선택:** ${choiceNames[botChoice]}

**미닝봇에게 패배했다밍.. 미닝봇에게 진 대가는 처참했다밍.. 배팅액의 3배인 ${moneyChange.toLocaleString()}원을 잃었다밍..ㅠ**

<:money:1489876006893518968> **잔액:** ${user.money.toLocaleString()}원 (-${moneyChange.toLocaleString()}원)`
      );
  }

  saveUsers();

  logGameResult(
  interaction,
  `가위바위보 결과: ${resultType} / 선택:${choiceNames[userChoice]} / 봇:${choiceNames[botChoice]} / 배팅:${amount.toLocaleString()}원 / 변동:${moneyChange.toLocaleString()}원 / 잔액:${user.money.toLocaleString()}원`
);

  return interaction.update({
    embeds: [embed],
    components: []
  });
}

/* ---------------- 별의각인 버튼 ---------------- */
if (interaction.customId === "engrave_upgrade") {
  const id = interaction.user.id;

  const collector = engraveCollectors.get(id);
  if (collector) {
    collector.resetTimer();
  }

  const user = ensureUser(id);
  const level = user.engraveLevel || 0;

  if (level >= 30) {
    return interaction.reply({
      content: "🏆 **이미 최대 단계다밍!**",
      flags: 64
    });
  }

  const nextLevel = level + 1;
  const data = engraveData[nextLevel];

  if (!data) return;

  if (user.inventory.engraveStone < data.stone) {
    return interaction.reply({
      content: "❌ **각인석이 부족하다밍!**",
      flags: 64
    });
  }

  user.inventory.engraveStone -= data.stone;

  const rand = Math.random() * 100;

  let resultText = "";
  let color = "#8b5cf6";

  if (rand < data.success) {
    user.engraveLevel += 1;
    resultText = `✨ **각인 성공이다밍! → Lv.${user.engraveLevel}**`;
    color = "#8b5cf6";
  } else if (rand < data.success + data.keep) {
    resultText = `➖ **각인이 유지됐다밍! → Lv.${user.engraveLevel}**`;
    color = "#facc15";
  } else {
    let foxProtectChance = 0;

    if (user.pet?.key === "fox") {
      const pet = getPetByKey("fox");

      if (pet?.option?.values) {
        const levels = Object.keys(pet.option.values)
          .map(Number)
          .sort((a, b) => b - a);

        for (const lvl of levels) {
          if ((user.pet.level || 1) >= lvl) {
            foxProtectChance = pet.option.values[lvl];
            break;
          }
        }
      }
    }

    const foxProtect = Math.random() * 100 < foxProtectChance;

    if (foxProtect) {
      resultText = `**폭시의 고유옵션이 발동했다밍!**
➖ **파괴를 막고 각인이 유지됐다밍! → Lv.${user.engraveLevel}**`;
      color = "#facc15";
    } else {
      user.level = 1;
      user.durability = 100;
      user.engraveLevel = 0;

      resultText = "💥 **파괴됐다밍... 무기가 Lv.1로 초기화되고 별의각인도 초기화됐다밍!**";
      color = "#ef4444";
    }
  }

  const afterStars = getEngraveStars(user.engraveLevel);

  const resultNextLevel = user.engraveLevel + 1;
  const resultData = engraveData[resultNextLevel];

  saveUsers();

  const weaponData = gameData.weapons["Lv" + user.level];

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("💫 **별의각인 결과**")
    .setDescription(
`${afterStars ? `${afterStars}\n\n` : ""}${resultText}

${resultData ? `**성공:** ${resultData.success}%
**유지:** ${resultData.keep}%
**파괴:** ${resultData.destroy}%

**필요 각인석:** ${resultData.stone}개` : "**최대 단계다밍!**"}
**보유 각인석:** ${user.inventory.engraveStone}개

**1분 동안 작동이 없으면 창이 자동으로 닫힌다밍!**`
    )
    .setImage(weaponData?.image || null);

  return interaction.update({
    embeds: [embed],
    components: interaction.message.components
  });
}

/* ---------------- 강화 버튼------------- */
if (interaction.customId === "upgrade") {
  const id = interaction.user.id;

  const collector = upgradeCollectors.get(id);
  if (collector) {
    collector.resetTimer();
  }

  if (!users[id]) {
    activeInteractions.delete(id);
    upgradeCollectors.delete(id);

    return interaction.reply({
      content: "❌ **먼저 /가입 을 해줘야 한다밍!**",
      flags: 64
    });
  }

  const user = ensureUser(id);
  const beforeLevel = user.level;

  if (beforeLevel >= 50) {
    activeInteractions.delete(id);
    upgradeCollectors.delete(id);

    return interaction.reply({
      content: "🏆 **최대 강화는 Lv50 이다밍!**",
      flags: 64
    });
  }

  const data = gameData.upgrade[beforeLevel];

  if (!data) {
    activeInteractions.delete(id);
    upgradeCollectors.delete(id);

    return interaction.reply({
      content: "❌ **강화 데이터가 없다밍!**",
      flags: 64
    });
  }

  let cost = data.cost;
  let wolfDiscount = 0;

  if (user.pet?.key === "wolf") {
    const pet = getPetByKey("wolf");
    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          wolfDiscount = pet.option.values[lvl];
          break;
        }
      }
    }

    cost = Math.floor(data.cost * (1 - wolfDiscount));
  }

  const successRate = data.success;
  const destroyRate = data.destroy;

  if (user.money < cost) {
    activeInteractions.delete(id);
    upgradeCollectors.delete(id);

    const embed = new EmbedBuilder()
      .setColor("#ff0000")
      .setTitle("<:money:1489876006893518968> **잔액 부족**")
      .setDescription(
`<:money:1489876006893518968> **필요 금액: ${cost.toLocaleString()}원**`
      );

    return interaction.update({
      embeds: [embed],
      components: []
    });
  }

  user.money -= cost;

  const rand = Math.random() * 100;

  let result = "";
  let color = "#57F287";

  if (rand <= destroyRate) {
    user.level = 1;
    result = "💥 **무기 파괴됐다밍... Lv1로 초기화다밍!**";
    color = "#ff0000";
  } else if (rand <= destroyRate + successRate) {
    user.level += 1;
    result = `✅ **강화 성공이다밍! → Lv${user.level}**`;
    color = "#57F287";
  } else {
    color = "#ff0000";

    if (beforeLevel % 10 === 0) {
      result = `❌ **강화 실패다밍... 단계 유지다밍 (Lv${user.level})**`;
    } else {
      user.level = Math.max(1, user.level - 1);
      result = `❌ **강화 실패다밍... → Lv${user.level}**`;
    }
  }

  if (wolfDiscount > 0) {
    result += `\n**울피의 고유옵션으로 강화 비용 ${Math.floor(wolfDiscount * 100)}% 할인됐다밍!**`;
  }

  if (user.level !== beforeLevel) {
    user.durability = 100;
  }

  saveUsers();

  const currentData = gameData.upgrade[user.level] || data;
  const weaponData = gameData.weapons["Lv" + user.level];

  if (!weaponData) {
    activeInteractions.delete(id);
    upgradeCollectors.delete(id);

    return interaction.reply({
      content: `❌ **Lv${user.level} 무기 데이터가 없다밍!**`,
      flags: 64
    });
  }

  let nextCost = currentData.cost;
  let nextWolfDiscount = 0;

  if (user.pet?.key === "wolf") {
    const pet = getPetByKey("wolf");

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          nextWolfDiscount = pet.option.values[lvl];
          break;
        }
      }
    }

    nextCost = Math.floor(currentData.cost * (1 - nextWolfDiscount));
  }

  const nextDiscountText =
    nextWolfDiscount > 0
      ? `\n**울피의 고유옵션 할인: -${Math.floor(nextWolfDiscount * 100)}% 적용됐다밍!**`
      : "";

  const upgradeButton = new ButtonBuilder()
    .setCustomId("upgrade")
    .setLabel("계속강화하기")
    .setStyle(ButtonStyle.Primary)
    .setDisabled(user.level >= 50);

  const stopButton = new ButtonBuilder()
    .setCustomId("stop")
    .setLabel("강화그만하기")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(upgradeButton, stopButton);

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle("<:enforce:1490211661691228341> **무기 강화**")
    .setDescription(
`<:weapon:1489875492051091536> **현재 무기**
**Lv${user.level} 「${weaponData.name}」**

**강화 확률**
성공: ${currentData.success}%
파괴: ${currentData.destroy}%

<:money:1489876006893518968> **강화 비용: ${nextCost.toLocaleString()}원**${nextDiscountText}
<:money:1489876006893518968> **현재 잔액: ${user.money.toLocaleString()}원**

${result}

**1분 동안 작동이 없으면 창이 자동으로 닫힌다밍!**`
    )
    .setImage(weaponData.image);

  if (user.level >= 50) {
    activeInteractions.delete(id);
    upgradeCollectors.delete(id);
  }

  return interaction.update({
    embeds: [embed],
    components: [row]
  });
}

/* ---------------- 복권 버튼 ---------------- */
if (interaction.customId === "lotto_sheep" || interaction.customId === "lotto_wolf") {
  const id = interaction.user.id;
  const user = ensureUser(id);

  const picked = interaction.customId.replace("lotto_", "");

  const disabledRow = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("lotto_end_sheep")
      .setEmoji("🐑")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true),

    new ButtonBuilder()
      .setCustomId("lotto_end_wolf")
      .setEmoji("🐺")
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(true)
  );

  user.lastLottoAt = Date.now();

  let successChance = 50;
  let petBonusText = "";

  if (user.pet?.key === "chick") {
    const pet = getPetByKey("chick");
    let petChance = 70;

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          petChance = pet.option.values[lvl];
          break;
        }
      }
    }

    successChance = petChance;
    petBonusText = `

**삐약이의 고유옵션으로 복권 성공 확률이 ${successChance}%가 되었다밍!**`;
  }

  const isSuccess = Math.random() * 100 < successChance;

  if (isSuccess) {
    const reward = Math.floor(Math.random() * (200000 - 100000 + 1)) + 100000;
    user.money += reward;
    saveUsers();

    logGameResult(
  interaction,
  `복권 결과: 성공 / 선택:${picked} / 보상:${reward.toLocaleString()}원 / 잔액:${user.money.toLocaleString()}원`
);

    const successEmbed = new EmbedBuilder()
      .setColor("#22c55e")
      .setTitle("복권성공")
      .setDescription(
`미닝봇과 교감을 성공한 당신...보상을 주겠어${petBonusText}

<:money:1489876006893518968> 잔액: ${user.money.toLocaleString()}원 (+${reward.toLocaleString()}원)

복권은 쿨타임이 1시간입니다.`
      );

    activeInteractions.delete(id);

    return interaction.update({
      embeds: [successEmbed],
      components: [disabledRow]
    });
  }

  saveUsers();

  logGameResult(
  interaction,
  `복권 결과: 실패 / 선택:${picked} / 잔액:${user.money.toLocaleString()}원`
);

  const failEmbed = new EmbedBuilder()
    .setColor("#ef4444")
    .setTitle("복권실패")
    .setDescription(
`유감이네요 미닝봇과 교감 실패...다음 기회에 다시 도전하라밍...${petBonusText}

복권은 쿨타임이 1시간입니다.`
    );

  activeInteractions.delete(id);

  return interaction.update({
    embeds: [failEmbed],
    components: [disabledRow]
  });
}

return; 
}

/* ---------------- 셀렉트 메뉴 ---------------- */
if (interaction.isStringSelectMenu() && interaction.customId === "bag_select") {
  const user = ensureUser(interaction.user.id);
  const selectedKey = interaction.values[0];
  const amount = user.inventory?.[selectedKey] || 0;

  if (amount <= 0) {
    return interaction.reply({
      content: "❌ 보유한 아이템이 없다밍!!! 다시 확인해봐라밍!",
      ephemeral: true
    });
  }

  // 🔧 수리석
  if (selectedKey === "repairStone") {
    const select = new UserSelectMenuBuilder()
      .setCustomId("use_repairStone")
      .setPlaceholder("수리석을 사용할 유저를 선택해달라밍!")
      .setMinValues(1)
      .setMaxValues(1);

    return interaction.reply({
  embeds: [
    new EmbedBuilder()
      .setColor("#3b82f6")
      .setTitle("<:repair:1489875654886297640> **수리석 사용**")
      .setDescription(

`**수리석을 사용하면 선택한 유저의 무기 내구도를 수리한다밍!
⚠️유저를 선택하면 바로 사용되니까 신중하게 골라야 한다밍!!**

<:repair:1489875654886297640>: ${amount}개`
      )
  ],
  components: [new ActionRowBuilder().addComponents(select)],
  ephemeral: true
});
  }

  // 💸 송금 더블 쿠폰
if (selectedKey === "depositDoubleCoupon") {
  const select = new UserSelectMenuBuilder()
    .setCustomId("use_depositDoubleCoupon")
    .setPlaceholder("쿠폰을 사용할 유저를 선택해달라밍!")
    .setMinValues(1)
    .setMaxValues(1);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#3B82F6")
        .setTitle("<:coupon:1496892441213665492> **송금 더블 쿠폰 사용**")
        .setDescription(

`**선택한 유저의 남은 송금 횟수를 2배로 늘려주는 쿠폰이다밍!
⚠️유저를 고르면 바로 적용되니까 신중하게 선택해야 한다밍!!**

<:coupon:1496892441213665492>: ${amount}개`
        )
    ],
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: true
  });
}

// 💸 송금 랜덤 쿠폰
if (selectedKey === "randomTransferCoupon") {
  const select = new UserSelectMenuBuilder()
    .setCustomId("use_randomTransferCoupon")
    .setPlaceholder("쿠폰을 사용할 유저를 선택해달라밍!")
    .setMinValues(1)
    .setMaxValues(1);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#ec4899")
        .setTitle("<:coupon2:1497620249766268938> **송금 랜덤 쿠폰 사용**")
        .setDescription(

`**선택한 유저의 송금 횟수를 랜덤으로 증가시키는 쿠폰이다밍!
⚠️유저를 고르면 바로 적용되니까 신중하게 선택해야 한다밍!!**

**쿠폰효과는 +3, +5, +7, +10 중 랜덤으로 증가한다밍!**

<:coupon2:1497620249766268938>: ${amount}개`
        )
    ],
    components: [new ActionRowBuilder().addComponents(select)],
    ephemeral: true
  });
}

 // 📦 물음표박스
if (selectedKey === "questionBox") {
  const openButton = new ButtonBuilder()
    .setCustomId("open_questionBox")
    .setLabel("열기")
    .setStyle(ButtonStyle.Success);

  return interaction.reply({
    embeds: [
      new EmbedBuilder()
        .setColor("#5865F2")
        .setTitle("<:box:1492879878838816849> **물음표박스**")
        .setDescription(

`**열면 다양한 보상을 얻을 수 있는 랜덤 박스다밍!
🍀운에 따라 예상치 못한 보상이 튀어나올지도 모른다밍…!**

<:box:1492879878838816849>: ${amount}개`
        )
    ],
    components: [new ActionRowBuilder().addComponents(openButton)],
  });
}

if (selectedKey === "petFood") {

  updatePetHunger(user);

  if ((user.pet.hunger ?? 100) >= 100) {
    return interaction.reply({
      content: "❌ **이미 배가 부른 상태라 더 이상 먹을 수 없다밍!**",
      flags: 64
    });
  }

  if ((user.pet?.hunger ?? 100) <= 0) {
    user.pet = {
      key: null,
      level: 1,
      optionChoice: null,
      hunger: 0,
      lastHungerAt: 0
    };

    saveUsers();

    return interaction.reply({
      content: "**펫이 배고픔을 이겨내지 못하고 결국 주인을 떠나버렸다밍..🥺**"
    });
  }

  if (!user.pet?.key) {
    return interaction.reply({
      content: "❌ **보유 중인 펫이 없다밍!**",
      flags: 64
    });
  }

  user.inventory.petFood -= 1;

  const rand = Math.random() * 100;

  let recover = 10;
  if (rand < 50) recover = 10;
  else if (rand < 90) recover = 30;
  else recover = 50;

  user.pet.hunger = Math.min(100, (user.pet.hunger ?? 100) + recover);
  user.pet.lastHungerAt = Date.now();

  saveUsers();

  const embed = new EmbedBuilder()
    .setColor("#f9a8d4")
    .setAuthor({
    name: interaction.user.username,
    iconURL: interaction.user.displayAvatarURL()
  })
    .setTitle("<:food:1501244821983989831> **펫먹이 사용**")
    .setDescription(
`**펫에게 먹이를 줬다밍!**

**배고픔 +${recover}%**
**현재 배고픔: ${user.pet.hunger}%**

**<:food:1501244821983989831>: ${user.inventory.petFood}개**`
    )
  .setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));
  return interaction.reply({
    embeds: [embed],
  });
}
}

if (interaction.customId === "shop_select") {
  const id = interaction.user.id;
  const user = ensureUser(id);
  resetDailyShopLimit(user);

  const selected = interaction.values[0];

  // =========================
  // 1. 무기 구매
  // =========================
  if (shopData.weapons[selected]) {
    const weapon = shopData.weapons[selected];

    if (user.money < weapon.price) {
      return interaction.reply({
        content: "❌ 돈이 부족합니다.",
        ephemeral: true
      });
    }

    if (user.level >= weapon.level) {
      return interaction.reply({
        content: "❌ 선택한 무기보다 보유한 무기가 더 높습니다.",
        ephemeral: true
      });
    }

    user.money -= weapon.price;
    user.level = weapon.level;
    user.durability = 100;

    saveUsers();

    const weaponData = gameData.weapons["Lv" + user.level];

    const buyEmbed = new EmbedBuilder()
      .setColor("#E5E7EB")
      .setAuthor({
    name: interaction.user.username,
    iconURL: interaction.user.displayAvatarURL()
  })
      .setTitle("구매 완료")
      .setDescription(
`<:weapon:1489875492051091536> ${weapon.name}을(를) 구매했습니다!

지급 무기: Lv${weapon.level} 「${weapon.name}」
내구도: 100

잔액: ${user.money.toLocaleString()}원 (-${weapon.price.toLocaleString()}원)`
      );

    if (weaponData?.image) {
      buyEmbed.setImage(weaponData.image);
    }

    const updatedShopEmbed = buildShopEmbed(user);
    const updatedSelectMenu = buildShopSelectMenu(user);

    await interaction.update({
      embeds: [updatedShopEmbed],
      components: [new ActionRowBuilder().addComponents(updatedSelectMenu)]
    });

    await interaction.followUp({
      embeds: [buyEmbed]
    });

    return;
  }

  // =========================
  // 2. 별의 각인 구매
  // =========================
  if (selected === "engraveStone_1" || selected === "engraveStone_50" || selected === "engraveStone_100") {
  let amount = 0;
  let price = 0;
  let label = "";

  if (selected === "engraveStone_1") {
    amount = 1;
    price = 100000000;
    label = "각인석 1개";
  }

  if (selected === "engraveStone_50") {
    amount = 50;
    price = 4700000000;
    label = "각인석 50개 묶음";
  }

  if (selected === "engraveStone_100") {
    amount = 100;
    price = 8500000000;
    label = "각인석 100개 묶음";
  }

  if (user.money < price) {
    return interaction.reply({
      content: "❌ 돈이 부족합니다.",
      ephemeral: true
    });
  }

  user.money -= price;

  if (!user.inventory.engraveStone) {
    user.inventory.engraveStone = 0;
  }

  user.inventory.engraveStone += amount;

  saveUsers();

  const buyEmbed = new EmbedBuilder()
    .setColor("#E5E7EB")
    .setAuthor({
    name: interaction.user.username,
    iconURL: interaction.user.displayAvatarURL()
  })
    .setTitle("구매 완료")
    .setDescription(
`💫 ${label}을 구매했습니다!

보유 수량: ${user.inventory.engraveStone}개
잔액: ${user.money.toLocaleString()}원 (-${price.toLocaleString()}원)`
    );

  const updatedShopEmbed = buildShopEmbed(user);
  const updatedSelectMenu = buildShopSelectMenu(user);

  await interaction.update({
    embeds: [updatedShopEmbed],
    components: [new ActionRowBuilder().addComponents(updatedSelectMenu)]
  });

  await interaction.followUp({
    embeds: [buyEmbed]
  });

  return;
}

  // =========================
  // 3. 물음표 상자 구매
  // =========================
if (selected === "questionBox") {
  const item = shopData.items.questionBox;

  if (!user.shopPurchase.questionBoxBoughtToday) {
    user.shopPurchase.questionBoxBoughtToday = 0;
  }

  if (!user.inventory.questionBox) {
    user.inventory.questionBox = 0;
  }

  if (user.shopPurchase.questionBoxBoughtToday >= 2) {
    return interaction.reply({
      content: "❌ 물음표박스는 하루 2개까지만 구매 가능합니다.",
      ephemeral: true
    });
  }

  if (user.inventory.questionBox >= 8) {
    return interaction.reply({
      content: "❌ 물음표박스는 최대 8개까지만 보유할 수 있습니다.",
      ephemeral: true
    });
  }

  if (user.money < item.price) {
    return interaction.reply({
      content: "❌ 돈이 부족합니다.",
      ephemeral: true
    });
  }

  user.money -= item.price;
  user.inventory.questionBox += 1;
  user.shopPurchase.questionBoxBoughtToday += 1;

  saveUsers();

  const buyEmbed = new EmbedBuilder()
    .setColor("#E5E7EB")
    .setAuthor({
    name: interaction.user.username,
    iconURL: interaction.user.displayAvatarURL()
  })
    .setTitle("구매 완료")
    .setDescription(
`<:box:1492879878838816849> 물음표박스 1개를 구매했습니다!

보유 수량: ${user.inventory.questionBox}개
오늘 구매 횟수: ${user.shopPurchase.questionBoxBoughtToday}/2

잔액: ${user.money.toLocaleString()}원 (-${item.price.toLocaleString()}원)`
    );

  const updatedShopEmbed = buildShopEmbed(user);
  const updatedSelectMenu = buildShopSelectMenu(user);

  await interaction.update({
    embeds: [updatedShopEmbed],
    components: [new ActionRowBuilder().addComponents(updatedSelectMenu)]
  });

  await interaction.followUp({
    embeds: [buyEmbed]
  });

  return;
}
  // =========================
  // fallback
  // =========================
  return interaction.reply({
    content: "❌ 알 수 없는 상품입니다.",
    ephemeral: true
  });
}

/* ---------------- 펫 상점 선택 ---------------- */
if (interaction.customId === "pet_shop_select") {
  const id = interaction.user.id;
  const user = ensureUser(id);

  const selected = interaction.values[0];

  // =========================
  // 1. 일반 펫뽑기
  // =========================
  if (selected === "normal_pet_gacha") {

  // 🔥 무기 Lv10 이상부터 펫 뽑기 가능
  if (user.level < 10) {
    return interaction.reply({
      content: "**무기 Lv10 이상부터 펫 뽑기가 가능하다밍!**",
    });
  }

  const price = 50000000;

    if (user.money < price) {
      return interaction.reply({
        content: "**돈이 부족하다밍!**",
        ephemeral: true
      });
    }

    user.money -= price;

    // 🔥 뽑기 확률
    const rand = Math.random() * 100;

    let pool;

    if (rand < 60) pool = petData.D;
    else if (rand < 95) pool = petData.C;
    else pool = petData.B;

    const pet = pool[Math.floor(Math.random() * pool.length)];

    // 🔥 기존 펫 덮어쓰기
    user.pet = {
     key: pet.key,
     level: 1,
     hunger: 100,
     lastHungerAt: Date.now()
    };

    saveUsers();

    // 🔥 등급별 색
    let color = "#9CA3AF"; // D

    if (pet.grade === "C") color = "#3B82F6";
    if (pet.grade === "B") color = "#8B5CF6";

    const resultEmbed = new EmbedBuilder()
      .setColor(color)
      .setAuthor({
    name: interaction.user.username,
    iconURL: interaction.user.displayAvatarURL()
  })
      .setTitle("**펫 뽑기를 완료 했다밍!**")
      .setDescription(

`**${pet.grade}등급**

${pet.summonText}

<:money:1489876006893518968> **잔액: ${user.money.toLocaleString()}원**`
      );

    const updatedEmbed = buildPetShopEmbed(user);
    const updatedMenu = buildPetShopSelectMenu(user);

    await interaction.update({
      embeds: [updatedEmbed],
      components: [new ActionRowBuilder().addComponents(updatedMenu)]
    });

    await interaction.followUp({
      embeds: [resultEmbed]
    });

    return;
  }

  // =========================
// 펫먹이 구매
// =========================
if (selected === "pet_food") {
  const price = 5000000;

  // 펫 없으면 구매 불가
  if (!user.pet?.key) {
    return interaction.reply({
      content: "❌ **펫을 보유 중일 때만 구매 가능하다밍!**",
      ephemeral: true
    });
  }

  if (user.money < price) {
    return interaction.reply({
      content: "❌ **돈이 부족하다밍!**",
      ephemeral: true
    });
  }

  user.money -= price;

  if (!user.inventory.petFood) {
    user.inventory.petFood = 0;
  }

  user.inventory.petFood += 1;

  saveUsers();

  const buyEmbed = new EmbedBuilder()
    .setColor("#9bc2fc")
    .setAuthor({
    name: interaction.user.username,
    iconURL: interaction.user.displayAvatarURL()
  })
    .setTitle("**구매 완료**")
    .setDescription(

`<:food:1501244821983989831> **펫에게 줄 먹이를 구매했다밍!**

<:food:1501244821983989831>: ${user.inventory.petFood}개
**잔액**: ${user.money.toLocaleString()}원 (-${price.toLocaleString()}원)`
    );

  const updatedEmbed = buildPetShopEmbed(user);
  const updatedMenu = buildPetShopSelectMenu(user);

  await interaction.update({
    embeds: [updatedEmbed],
    components: [new ActionRowBuilder().addComponents(updatedMenu)]
  });

  await interaction.followUp({
    embeds: [buyEmbed]
  });

  return;
}

  // =========================
  // fallback
  // =========================
  return interaction.reply({
    content: "❌ 알 수 없는 상품입니다.",
    ephemeral: true
  });
}

/* ---------------- 유저 선택 메뉴 ---------------- */
if (interaction.isUserSelectMenu()) {

  if (!interaction.customId.startsWith("use_")) return;

  await interaction.deferUpdate();

  const user = ensureUser(interaction.user.id);
  const targetId = interaction.values[0];

  const targetMember = await interaction.guild.members.fetch(targetId).catch(() => null);

  if (!targetMember) {
    return interaction.followUp({
      content: "❌ **같은 서버에 있는 유저에게만 사용할 수 있다밍!**",
      ephemeral: true
    });
  }

  if (targetMember.user.bot) {
    return interaction.followUp({
      content: "❌ **봇에게는 사용할 수 없다밍!**",
      ephemeral: true
    });
  }

  const target = ensureUser(targetId);

  // =========================
  // 🔧 수리석
  // =========================
  if (interaction.customId === "use_repairStone") {

    if (!user.inventory.repairStone || user.inventory.repairStone <= 0) {
      return interaction.followUp({
        content: "❌ **보유한 수리석이 없다밍!!!**",
        ephemeral: true
      });
    }

    if (target.durability >= 100) {
      return interaction.followUp({
        content: "❌ **이미 내구도가 100이라 못 쓴다밍!**",
        ephemeral: true
      });
    }

    const repair = getRepairAmount();

    user.inventory.repairStone -= 1;
    target.durability = Math.min(100, target.durability + repair);

    saveUsers();

    const weaponData = gameData.weapons["Lv" + target.level];
    const weaponName = weaponData?.name || "무기 없음";

    const repairEmbed = new EmbedBuilder()
      .setColor("#22c55e")
      .setTitle("<:repair:1489875654886297640> 수리 완료")
      .setDescription(
`**<@${interaction.user.id}>님이 <@${targetId}>님의 무기를 수리했다밍!**

Lv${target.level} ${weaponName}
**내구도**: ${target.durability}(+${repair})

<:repair:1489875654886297640>: ${user.inventory.repairStone}개`
      );

    if (weaponData?.image) {
      repairEmbed.setImage(weaponData.image);
    }

    return interaction.followUp({
      embeds: [repairEmbed],
      allowedMentions: { parse: [] }
    });
  }

  // =========================
  // 💸 송금 더블 쿠폰
  // =========================
  if (interaction.customId === "use_depositDoubleCoupon") {

    if (!user.inventory.depositDoubleCoupon || user.inventory.depositDoubleCoupon <= 0) {
      return interaction.followUp({
        content: "❌ **보유한 쿠폰이 없다밍!!!**",
        ephemeral: true
      });
    }

    resetDailyTransferLimit(target);

    const remaining = target.transfer.maxCount - target.transfer.usedCount;

    if (remaining <= 0) {
      return interaction.followUp({
        content: "❌ **남은 송금 횟수가 없다밍!**",
        ephemeral: true
      });
    }

    if (remaining > 10) {
      return interaction.followUp({
        content: "❌ **송금 더블 쿠폰은 남은 송금 횟수가 10회 이하일 때만 사용할 수 있다밍!**",
        ephemeral: true
      });
    }

user.inventory.depositDoubleCoupon -= 1;
target.transfer.maxCount += remaining;
    saveUsers();

    const senderMember = interaction.guild.members.cache.get(interaction.user.id);
    const senderName = senderMember?.displayName || interaction.user.username;
    const targetName = targetMember.displayName;

    const couponEmbed = new EmbedBuilder()
      .setColor("#14b8a6")
      .setTitle("<:coupon:1496892441213665492> 송금 더블 쿠폰 사용")
      .setDescription(
`**<@${interaction.user.id}>님이 <@${targetId}>님에게 송금 더블 쿠폰을 사용했다밍!**

**<@${targetId}>님의 남은 송금 횟수가 2배로 늘어났다밍!**

<:coupon:1496892441213665492>: ${user.inventory.depositDoubleCoupon}개`
      );

    return interaction.followUp({
      embeds: [couponEmbed],
      allowedMentions: { parse: [] }
    });
  }

  // =========================
// 🎲 송금 랜덤 쿠폰
// =========================
if (interaction.customId === "use_randomTransferCoupon") {

  if (!user.inventory.randomTransferCoupon || user.inventory.randomTransferCoupon <= 0) {
    return interaction.followUp({
      content: "❌ **보유한 송금 랜덤 쿠폰이 없다밍!!!**",
      ephemeral: true
    });
  }

  resetDailyTransferLimit(target);

  const remaining = target.transfer.maxCount - target.transfer.usedCount;

  if (remaining > 20) {
    return interaction.followUp({
      content: "❌ **송금 랜덤 쿠폰은 남은 송금 횟수가 20회 이하일 때만 사용할 수 있다밍!**",
      ephemeral: true
    });
  }

  const bonusList = [3, 5, 7, 10];
  const bonus = bonusList[Math.floor(Math.random() * bonusList.length)];

  user.inventory.randomTransferCoupon -= 1;
  target.transfer.maxCount += bonus;

  saveUsers();

  const couponEmbed = new EmbedBuilder()
    .setColor("#ec4899")
    .setTitle("<:coupon2:1497620249766268938> 송금 랜덤 쿠폰 사용")
    .setDescription(
`**<@${interaction.user.id}>님이 <@${targetId}>님에게 송금 랜덤 쿠폰을 사용했다밍!**

**결과: +${bonus}회**
**<@${targetId}>님의 송금 횟수가 증가했다밍!**

<:coupon2:1497620249766268938>: ${user.inventory.randomTransferCoupon}개`
    );

  return interaction.followUp({
    embeds: [couponEmbed],
    allowedMentions: { parse: [] }
  });
}
}
/* ---------------- 슬래시 명령어 ---------------- */
if (!interaction.isChatInputCommand()) return;

const commandName = interaction.commandName;
const id = interaction.user.id;

const noJoinRequiredCommands = [
  "가입",
  "탈퇴",
  "쿠폰생성",
  "돈지급",
  "돈초기화",
  "무기지급",
  "무기초기화",
  "정보초기화",
  "각인설정"
];

if (
  !users[id] &&
  !noJoinRequiredCommands.includes(commandName) &&
  !(commandName === "훔쳐보기" && isAdmin(id))
) {
  return interaction.reply({
    content: "**먼저 `/가입`을 해야 명령어를 사용할 수 있다밍!**",
    ephemeral: true
  });
}

/* ---------------- 가입 ---------------- */
if (commandName === "가입") {
  if (users[id]) {
    return interaction.reply({
      content: "❌ **이미 가입한 유저다밍!**",
      ephemeral: true
    });
  }

  users[id] = JSON.parse(JSON.stringify(defaultUser));
  users[id].joinDate = new Date().toLocaleDateString("ko-KR");
  saveUsers();

  const tutorialUrl = "https://discord.com/channels/1487757478245699608/1490178713520967690";

  const embed = new EmbedBuilder()
    .setColor("#22c55e")
    .setTitle("**가입완료**")
    .setDescription(
`**미닝 봇 이용안내는 [Tutorial](${tutorialUrl})에서 확인해달라밍!**

<:money:1489876006893518968> **가입지원금:** ${users[id].money.toLocaleString()}원
<:weapon:1489875492051091536> **시작무기:** Lv${users[id].level}`
    );

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 탈퇴 ---------------- */
if (commandName === "탈퇴") {
  if (!users[id]) {
    return interaction.reply({
      content: "❌ **가입한 유저가 아니다밍!**",
      ephemeral: true
    });
  }

  const user = ensureUser(id);

  if (user.money < 0) {
    return interaction.reply({
      content: "❌ **보유 금액이 마이너스면 탈퇴할 수 없다밍!**",
      ephemeral: true
    });
  }

  const embed = new EmbedBuilder()
    .setColor("#ff0000")
    .setTitle("**⚠️ 탈퇴 확인**")
    .setDescription(
`**정말 탈퇴하시겠냐밍?**

**탈퇴 시 모든 데이터가 삭제된다밍!**

**그래도 진행하려면 아래 버튼을 눌러달라밍!**`
    );

  const withdrawButton = new ButtonBuilder()
    .setCustomId("withdraw_confirm")
    .setLabel("탈퇴하기")
    .setStyle(ButtonStyle.Danger);

  const cancelButton = new ButtonBuilder()
    .setCustomId("withdraw_cancel")
    .setLabel("취소")
    .setStyle(ButtonStyle.Secondary);

  const row = new ActionRowBuilder().addComponents(withdrawButton, cancelButton);

  return interaction.reply({
    embeds: [embed],
    components: [row],
    ephemeral: true
  });
}

  /* ---------------- 윷놀이 on&off ---------------- */
  if (commandName === "윷온") {
  if (interaction.user.id !== ADMIN_ID) {
    return interaction.reply({
      content: "❌ 관리자만 사용할 수 있는 명령어입니다.",
      ephemeral: true
    });
  }
    yutEnabled = true;
    return interaction.reply("✅ 윷놀이 활성화");
  }

  if (commandName === "윷오프") {
  if (interaction.user.id !== ADMIN_ID) {
    return interaction.reply({
      content: "❌ 관리자만 사용할 수 있는 명령어입니다.",
      ephemeral: true
    });
  }

    yutEnabled = false;
    return interaction.reply("❌ 윷놀이 비활성화");
  }

  /* ---------------- 가방 ---------------- */
  if (commandName === "가방") {
    const user = ensureUser(id);
    const bagItemData = getBagItemMeta();

    const ownedItems = Object.entries(user.inventory || {}).filter(
      ([key, amount]) => amount > 0 && bagItemData[key]
    );

    if (ownedItems.length === 0) {
      const emptyEmbed = new EmbedBuilder()
        .setColor("#6f6f70")
        .setTitle("💼 가방")
        .setDescription("보유 중인 아이템이 없습니다.");

      return interaction.reply({
        embeds: [emptyEmbed],
        ephemeral: true
      });
    }

    const options = ownedItems.map(([key, amount]) => {
      const emoji = normalizeComponentEmoji(bagItemData[key].emoji);

      return {
        label: bagItemData[key].label,
        description: `보유 수량: ${amount}개`,
        value: key,
        ...(emoji ? { emoji } : {})
      };
    });

    const embed = new EmbedBuilder()
      .setColor("#6f6f70")
      .setTitle("💼 가방")
      .setDescription("보유중인 아이템을 선택하고 사용해보세요.");

    const selectMenu = new StringSelectMenuBuilder()
      .setCustomId("bag_select")
      .setPlaceholder("아이템을 선택하세요")
      .addOptions(options);

    const row = new ActionRowBuilder().addComponents(selectMenu);

    return interaction.reply({
      embeds: [embed],
      components: [row],
      ephemeral: true
    });
  }

/* ---------------- 출석체크 ---------------- */
if (commandName === "출석체크") {
  const user = ensureUser(id);
  const todayKey = getTodayKey();
  const todayText = formatTodayText();

  if (user.lastAttendanceDate === todayKey) {
    return interaction.reply({
      content: "❌ **오늘은 이미 출석체크를 완료했다밍!**",
      ephemeral: true
    });
  }

  user.attendanceDays += 1;
  user.lastAttendanceDate = todayKey;

  const baseReward = 10000;
  const bonusReward = attendanceBonus[user.attendanceDays] || 0;
  let totalReward = baseReward + bonusReward;
  let petBonusText = "";

  if (user.pet?.key === "dust") {
    const pet = getPetByKey("dust");
    let multiplier = 1;

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          multiplier = pet.option.values[lvl];
          break;
        }
      }
    }

    totalReward *= multiplier;

    petBonusText = `

**탄이의 고유옵션으로 출석 보상이 ${multiplier}배가 되었다밍!**`;
  }

  user.money += totalReward;
  saveUsers();

  let description =
`**${todayText} 출석체크 완료다밍! (+${baseReward.toLocaleString()}원)**`;

  if (bonusReward > 0) {
    description += `
**${user.attendanceDays}일 달성 축하한다밍!! (+${bonusReward.toLocaleString()}원)**`;
  }

  description += petBonusText;
  description += `

**출석일수:** ${user.attendanceDays.toLocaleString()}일
<:money:1489876006893518968> **잔액:** ${user.money.toLocaleString()}원 (+${totalReward.toLocaleString()}원)`;

  const embed = new EmbedBuilder()
    .setColor("#22c55e")
    .setTitle("**🗓️ 출석체크 완료**")
    .setDescription(description);

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 윷대결 ---------------- */
if (commandName === "윷대결") {

  // 🔥 ON/OFF 체크
  if (!yutEnabled) {
    return interaction.reply({
      content: "❌ **현재 윷놀이가 비활성화 상태다밍!**",
      ephemeral: true
    });
  }

  // 🔥 채널 제한 체크
  if (YUT_CHANNEL_IDS.length > 0 && !YUT_CHANNEL_IDS.includes(interaction.channel.id)) {
    return interaction.reply({
      content: "❌ **이 채널에서는 윷놀이를 사용할 수 없다밍!**",
      ephemeral: true
    });
  }

  const target = interaction.options.getUser("상대");

  if (!target) {
    return interaction.reply({
      content: "❌ **대결할 유저를 선택해달라밍!**",
      ephemeral: true
    });
  }

  if (target.bot) {
    return interaction.reply({
      content: "❌ **봇과는 윷대결을 할 수 없다밍!**",
      ephemeral: true
    });
  }

  if (target.id === interaction.user.id) {
    return interaction.reply({
      content: "❌ **자기 자신과는 윷대결을 할 수 없다밍!**",
      ephemeral: true
    });
  }

  if (!users[target.id]) {
    return interaction.reply({
      content: "❌ **상대 유저가 아직 가입하지 않았다밍!**",
      ephemeral: true
    });
  }

  if (getYutGame(interaction.channel.id)) {
    return interaction.reply({
      content: "❌ **이 채널에서는 이미 진행 중이거나 대기 중인 윷대결이 있다밍!**",
      ephemeral: true
    });
  }

  const game = createYutGame(
    interaction.channel.id,
    interaction.user.id,
    target.id
  );

  const acceptButton = new ButtonBuilder()
    .setCustomId("yut_accept")
    .setLabel("수락")
    .setStyle(ButtonStyle.Success);

  const declineButton = new ButtonBuilder()
    .setCustomId("yut_decline")
    .setLabel("거절")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(acceptButton, declineButton);

  const embed = new EmbedBuilder()
    .setColor("#E5E7EB")
    .setTitle("**윷놀이 대결 신청**")
    .setDescription(
`**${interaction.user}님이 ${target}님에게 윷놀이 대결을 신청했다밍!**

**규칙**
- **1:1 대결이다밍**
- **말 2개씩 사용한다밍**
- **바깥 테두리를 따라 한 바퀴 돌면 완주다밍**
- **상대 말을 잡으면 상대 말은 출발지로 돌아간다밍**
- **상대를 잡으면 한 번 더 던질 수 있다밍**
- **말 두 개를 먼저 완주시키면 승리다밍**

**${target}님은 아래 버튼을 눌러 수락 또는 거절해달라밍!**`
    );

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

/* ---------------- 강화 ---------------- */
if (commandName === "강화") {
  if (activeInteractions.has(id)) {
    return interaction.reply({
      content: "❌ **이미 진행 중이다밍!**",
      flags: 64
    });
  }

  if (!users[id]) {
    return interaction.reply({
      content: "❌ **먼저 /가입 을 해줘야 한다밍!**",
      flags: 64
    });
  }

  activeInteractions.add(id);

  const user = ensureUser(id);
  const weaponData = gameData.weapons["Lv" + user.level];
  const upgradeData = gameData.upgrade[user.level];

  if (!weaponData) {
    activeInteractions.delete(id);
    return interaction.reply({
      content: `❌ **Lv${user.level} 무기 데이터가 없다밍!**`,
      flags: 64
    });
  }

  if (!upgradeData) {
    activeInteractions.delete(id);
    return interaction.reply({
      content: `❌ **Lv${user.level} 강화 데이터가 없다밍!**`,
      flags: 64
    });
  }

  let upgradeCost = upgradeData.cost;
  let wolfDiscount = 0;

  if (user.pet?.key === "wolf") {
    const pet = getPetByKey("wolf");

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          wolfDiscount = pet.option.values[lvl];
          break;
        }
      }
    }

    upgradeCost = Math.floor(upgradeData.cost * (1 - wolfDiscount));
  }

  const canUpgrade = user.level < 50 && user.money >= upgradeCost;

  const wolfDiscountText =
    wolfDiscount > 0
      ? `**울피의 고유옵션 할인: -${Math.floor(wolfDiscount * 100)}% 적용됐다밍!**`
      : "";

 const descriptionLines = [
  `<:weapon:1489875492051091536> **현재 무기**`,
  `**Lv${user.level} 「${weaponData.name}」**`,
  ``,

  `**강화 확률**`,
  `성공: ${upgradeData.success}%`,
  `파괴: ${upgradeData.destroy}%`,
  ``,

  `<:money:1489876006893518968> **강화 비용: ${upgradeCost.toLocaleString()}원**`,
  `<:money:1489876006893518968> **현재 잔액: ${user.money.toLocaleString()}원**`,
  ``,
];

  if (user.level >= 50) {
    descriptionLines.push(`🏆 **최대 강화 레벨이다밍!**`);
  } else if (user.money < upgradeCost) {
    descriptionLines.push(`❌ **잔액 부족으로 강화 불가능이다밍!**`);
  }

  descriptionLines.push(`1분 동안 작동이 없으면 창이 자동으로 닫힌다밍!`);

  const embed = new EmbedBuilder()
    .setColor(canUpgrade ? "#5865F2" : "#ff0000")
    .setTitle("<:enforce:1490211661691228341> **무기강화**")
    .setDescription(descriptionLines.join("\n"))
    .setImage(weaponData.image);

  if (!canUpgrade) {
    activeInteractions.delete(id);
    return interaction.reply({
      embeds: [embed]
    });
  }

  const upgradeButton = new ButtonBuilder()
    .setCustomId("upgrade")
    .setLabel("계속강화하기")
    .setStyle(ButtonStyle.Primary);

  const stopButton = new ButtonBuilder()
    .setCustomId("stop")
    .setLabel("강화그만하기")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(upgradeButton, stopButton);

  const msg = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true
  });

  const collector = msg.createMessageComponentCollector({
    idle: 60000
  });

  upgradeCollectors.set(id, collector);

  collector.on("end", async (collected, reason) => {
    if (reason === "stopped") return;

    try {
      activeInteractions.delete(id);
      upgradeCollectors.delete(id);

      const closedEmbed = new EmbedBuilder()
        .setColor("#ff0000")
        .setDescription(
`ㅤ
**1분 동안 작동하지 않아 창이 자동으로 닫혔다밍!**
ㅤ`
        );

      await msg.edit({
        embeds: [closedEmbed],
        components: []
      });
    } catch (err) {
      console.log("자동 종료 오류:", err.message);
    }
  });
}

/* ---------------- 로또 ---------------- */
if (commandName === "로또") {
  const user = ensureUser(id);

  const amount = interaction.options.getInteger("금액");

  // 최소 금액
  if (amount < 5000) {
    return interaction.reply({
      content: "**최소 5,000원부터 배팅 가능하다밍!**",
      ephemeral: true
    });
  }

  // 돈 부족
  if (user.money < amount) {
    return interaction.reply({
      content: "**돈이 부족하다밍!**",
      ephemeral: true
    });
  }

  // 결과 뽑기
  const result = getLottoResult();

  // 최종 금액 계산
  const profit = Math.floor(amount * result.multiplier);

  // 돈 지급
  user.money += profit;

  saveUsers();

  logGameResult(
  interaction,
  `로또 결과: ${result.name} / 배팅:${amount.toLocaleString()}원 / 변동:${profit.toLocaleString()}원 / 잔액:${user.money.toLocaleString()}원`
);

  // + 표시
  const sign = profit >= 0 ? "+" : "";

  // 색상
  let color = "#22c55e";

  if (result.type === "draw") {
    color = "#888887";
  }

  if (result.type === "lose") {
    color = "#ef4444";
  }

  if (result.name === "**단독 당첨**") {
  color = "#3b82f6";
  }

  // 임베드
  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(`${result.name}`)
    .setDescription(

`${result.message}

<:money:1489876006893518968> **잔액:** ${user.money.toLocaleString()}원 (${sign}${profit.toLocaleString()}원)

${result.effect}`
    )
.setThumbnail(interaction.user.displayAvatarURL({ dynamic: true }));

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 낚시 ---------------- */
if (commandName === "낚시") {
  const id = interaction.user.id;
  const user = ensureUser(id);

  const amount = interaction.options.getInteger("금액");

  // 최소 금액
  if (amount < 40000) {
    return interaction.reply({
      content: "**최소 배팅 금액은 40,000원이다밍!**",
      ephemeral: true
    });
  }

  // 돈 부족
  if (user.money < amount) {
    return interaction.reply({
      content: "**넌 지금 돈이 부족하다밍!**",
      ephemeral: true
    });
  }

  // 결과
  const result = getFishingResult();

  // 증감 금액
  const changeAmount = amount * result.multiplier;

  // 최종 잔액 반영
  user.money += changeAmount;

  saveUsers();

  logGameResult(
  interaction,
  `낚시 결과: ${result.name} / 배팅:${amount.toLocaleString()}원 / 변동:${changeAmount.toLocaleString()}원 / 잔액:${user.money.toLocaleString()}원`
);

  // 메시지 금액 치환
  const resultText = result.message.replace(
    "{amount}",
    Math.abs(changeAmount).toLocaleString()
  );

  // + / -
  const sign = changeAmount >= 0 ? "+" : "-";

  // 설명
  const description =
`${resultText}

<:money:1489876006893518968> 잔액: ${user.money.toLocaleString()}원 (${sign}${Math.abs(changeAmount).toLocaleString()}원)

${result.effect}`;

  // 이미지 파일
  const imageFile = new AttachmentBuilder(result.image);

 // 색상
let color = "#ef4444"; // 실패

if (result.type === "win") {
  color = "#22c55e"; // 일반 성공
}

if (result.multiplier === 30) {
  color = "#3b82f6";
}

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(result.name)
    .setDescription(description)
    .setThumbnail(`attachment://${result.image.split("/").pop()}`);

  return interaction.reply({
    embeds: [embed],
    files: [imageFile]
  });
}

/* ---------------- 배그 ---------------- */
if (commandName === "배그") {
  const pubgLockId = interaction.user.id;

  if (pubgPlayingUsers.has(pubgLockId)) {
    return interaction.reply({
      content: "**이미 배그 결과를 처리 중이다밍! 결과가 나온 뒤 다시 해달라밍!**",
      flags: 64
    });
  }

  pubgPlayingUsers.add(pubgLockId);

  await interaction.deferReply();

  try {
    const user = ensureUser(id);
    const amount = interaction.options.getInteger("금액");

    if (amount < 1000) {
      return interaction.editReply({
        content: "❌ **1,000원 이상 입력해야 한다밍!**"
      });
    }

    // 🔥 여기 통합됨
    if (user.money < amount) {
      return interaction.editReply({
        content: "<:money:1489876006893518968> **돈이 부족하다밍!**"
      });
    }

    const selectedTier = getRandomPubgTier();
    const reward = amount * selectedTier.multiplier;

    user.money += reward;
    saveUsers();

    logGameResult(
  interaction,
  `배그 결과: ${selectedTier.name} / 배팅:${amount.toLocaleString()}원 / 변동:${reward.toLocaleString()}원 / 잔액:${user.money.toLocaleString()}원`
);

    const resultText =
      reward >= 0
        ? `${amount.toLocaleString()}원을 배팅해 ${reward.toLocaleString()}원을 획득했다밍!`
        : `${amount.toLocaleString()}원을 배팅해 ${Math.abs(reward).toLocaleString()}원을 잃었다밍!`;

    const moneyText = `${user.money.toLocaleString()}원`;
    const gainText =
      reward >= 0
        ? `+${reward.toLocaleString()}원`
        : `-${Math.abs(reward).toLocaleString()}원`;

    const imageBuffer = await drawPubgResultImage({
      tierName: selectedTier.name,
      resultText,
      moneyText,
      gainText,
      money: user.money,
      gain: reward,
      username: interaction.user.username,
      iconUrl: selectedTier.icon,
      bgUrl: selectedTier.bg,
      messageText: selectedTier.message
    });

    const attachment = new AttachmentBuilder(imageBuffer, {
      name: "pubg-result.png"
    });

    return interaction.editReply({
      content: `<:money:1489876006893518968> **내 잔액:** ${moneyText} (${gainText})`,
      files: [attachment]
    });

  } catch (error) {
    console.error("배그 명령어 오류:", error);

    return interaction.editReply({
      content: "❌ **배그 결과 이미지를 생성하는 중 오류가 발생했다밍!**"
    });

  } finally {
    pubgPlayingUsers.delete(pubgLockId);
  }
}

/* ---------------- 가위바위보 ---------------- */
if (commandName === "가위바위보") {
  const user = ensureUser(id);
  const amount = interaction.options.getInteger("배팅액");

  if (user.money < amount) {
    return interaction.reply({
      content: "❌ **배팅할 금액이 부족하다밍!**",
      flags: 64
    });
  }

  const embed = new EmbedBuilder()
    .setColor("#749df5")
    .setTitle("짱깸뽀")
    .setDescription(
`**미닝봇이랑 짱깸뽀를 해서 이겨보라밍!**

**아래 보이는 버튼 3개 중 고르고 싶은걸 고르라밍!**

<:money:1489876006893518968> **배팅액:** ${amount.toLocaleString()}원`
    );

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId(`rps_scissors_${amount}`)
      .setLabel("✌️")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`rps_rock_${amount}`)
      .setLabel("✊")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId(`rps_paper_${amount}`)
      .setLabel("✋")
      .setStyle(ButtonStyle.Primary)
  );

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

/* ---------------- 파산신청 ---------------- */
if (commandName === "파산신청") {
  const user = ensureUser(id);

  const now = Date.now();
  let cooldown = 60 * 60 * 1000;
  cooldown = applyCooldownPet(user, cooldown);

  if (now < user.bankruptcyCooldown) {
    const remaining = user.bankruptcyCooldown - now;
    const hours = Math.floor(remaining / 3600000);
    const minutes = Math.floor((remaining % 3600000) / 60000);
    const seconds = Math.floor((remaining % 60000) / 1000);

    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("파산신청")
          .setDescription(`**아직 파산신청을 다시 할 수 없다밍!**  
**남은 시간: ${hours}시간 ${minutes}분 ${seconds}초다밍!**`)
      ],
      ephemeral: true
    });
  }

  if (user.money >= 0) {
    return interaction.reply({
      embeds: [
        new EmbedBuilder()
          .setColor("#ff0000")
          .setTitle("파산신청")
          .setDescription("**❌ 잔액이 마이너스일 때만 파산신청이 가능하다밍!**")
      ],
      ephemeral: true
    });
  }

  let raccoonActive = false;

  if (user.pet?.key === "raccoon") {
    const pet = getPetByKey("raccoon");
    let raccoonChance = 0;

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          raccoonChance = pet.option.values[lvl];
          break;
        }
      }
    }

    if (Math.random() * 100 < raccoonChance) {
      raccoonActive = true;
    }
  }

  const rand = Math.random() * 100;

  let resultText = "";
  let color = "#22c55e";
  let title = "";

  if (raccoonActive) {
    if (rand < 50) {
      user.money = 0;
      resultText = "**너부리의 고유옵션이 발동했다밍!**\n**잔액이 전부 탕감되었다밍! 완전 새 출발이다밍!**";
      title = "🏦 파산신청 승인";
      color = "#22c55e";
    } else {
      const debt = Math.abs(user.money);
      const reduced = Math.floor(debt * 0.5);
      user.money += reduced;

      resultText = `**너부리의 고유옵션이 발동했다밍!**
**잔액의 절반이 탕감되었다밍!**  
**탕감 금액: ${reduced.toLocaleString()}원이다밍!**`;
      title = "🕊️ 파산신청 승인";
      color = "#f59e0b";
    }
  } else {
    if (rand < 15) {
      user.money = 0;
      resultText = "**잔액이 전부 탕감되었다밍! 완전 새 출발이다밍!**";
      title = "🏦 파산신청 승인";
      color = "#22c55e";
    } else if (rand < 85) {
      const debt = Math.abs(user.money);
      const reduced = Math.floor(debt * 0.5);
      user.money += reduced;

      resultText = `**잔액의 절반이 탕감되었다밍!**  
**탕감 금액: ${reduced.toLocaleString()}원이다밍!**`;
      title = "🕊️ 파산신청 승인";
      color = "#f59e0b";
    } else {
      resultText = "**파산신청이 거절되었다밍ㅜ…**";
      title = "😈 파산신청 거절";
      color = "#ff0000";
    }
  }

  user.bankruptcyCooldown = now + cooldown;
  saveUsers();

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(`${resultText}

**<:money:1489876006893518968> 현재 잔액: ${user.money.toLocaleString()}원이다밍!**  
**파산신청은 일정 시간마다 다시 시도할 수 있다밍!**`);

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 순위 ---------------- */
if (commandName === "순위") {
  const subcommand = interaction.options.getSubcommand();

  if (subcommand === "돈") {
    const sorted = Object.entries(users)
  .filter(([userId]) => !isRankingExcluded(userId))
  .sort((a, b) => (b[1].money || 0) - (a[1].money || 0));

    const top = sorted.slice(0, 10);

    let rankText = "";
    let firstPlaceAvatar = null;

    for (let i = 0; i < top.length; i++) {
      const [userId, data] = top[i];

      let username = "알 수 없음";
      let avatarURL = null;

      try {
        const discordUser = await client.users.fetch(userId);
        username = discordUser.username;
        avatarURL = discordUser.displayAvatarURL({ size: 256 });
      } catch (e) {}

      // 🏆 순위 표시
      let rankLabel;

      if (i === 0) rankLabel = "🥇";
      else if (i === 1) rankLabel = "🥈";
      else if (i === 2) rankLabel = "🥉";
      else rankLabel = `${i + 1}.`;

      // 1등 프로필 저장
      if (i === 0 && avatarURL) {
        firstPlaceAvatar = avatarURL;
      }

      rankText += `${rankLabel} ${username}
${(data.money || 0).toLocaleString()}원

`;
    }

    const myRankIndex = sorted.findIndex(([userId]) => userId === id);
    const myRank = myRankIndex + 1;

    let myUsername = "알 수 없음";

    try {
      const discordUser = await client.users.fetch(id);
      myUsername = discordUser.username;
    } catch (e) {}

    const myMoney = users[id]?.money || 0;

    let description = rankText.trimEnd();

    // 🔥 10등 밖일 때만 내 순위 표시
    if (myRank > 10) {
      description += `

${myRank} , ${myUsername}
${myMoney.toLocaleString()}원`;
    }

    const embed = new EmbedBuilder()
      .setColor("#63625d")
      .setTitle("<:money:1489876006893518968> 돈 순위")
      .setDescription(description);

    // 🖼️ 1등 프로필사진
    if (firstPlaceAvatar) {
      embed.setThumbnail(firstPlaceAvatar);
    }

    return interaction.reply({
      embeds: [embed]
    });
  }
}

/* ---------------- 정보 ---------------- */
if (commandName === "정보") {
  await interaction.deferReply();

  const user = ensureUser(id);

  const buffer = await drawInfoImage(interaction, user);

  const attachment = new AttachmentBuilder(buffer, {
    name: "info.png"
  });

  return interaction.editReply({
    files: [attachment]
  });
}

/* ---------------- 훔쳐보기 ---------------- */
if (commandName === "훔쳐보기") {
  const isAdminUser = isAdmin(id);

  const user = isAdminUser
    ? (users[id] || { money: 0 })
    : ensureUser(id);

  const cost = 50000;

  if (!isAdminUser && user.money < cost) {
    return interaction.reply({
      content: `**훔쳐보기 비용이 부족하다밍** (필요 금액: ${cost.toLocaleString()}원)`,
      ephemeral: true
    });
  }

  const target = interaction.options.getUser("유저");
  const targetId = target.id;

  if (!users[targetId]) {
    return interaction.reply({
      content: "**해당 유저는 가입되어 있지 않다밍!**",
      ephemeral: true
    });
  }

  const targetUser = ensureUser(targetId);

  if (!isAdminUser) {
    user.money -= cost;
    saveUsers();
  }

  await interaction.deferReply();

  const buffer = await drawInfoImage(
    interaction,
    targetUser,
    target
  );

  const attachment = new AttachmentBuilder(buffer, {
    name: "peek-info.png"
  });

  return interaction.editReply({
    content: isAdminUser
      ? "**관리자 권한으로 조건 없이 훔쳐보기를 사용했다밍!**"
      : `<:money:1489876006893518968> 내 잔액: ${user.money.toLocaleString()}원 (-${cost.toLocaleString()}원)`,

    files: [attachment],
    allowedMentions: { parse: [] }
  });
}

/* ---------------- 송금 ---------------- */
if (commandName === "송금") {
  const sender = ensureUser(id);
  resetDailyTransferLimit(sender);

  const targetUser = interaction.options.getUser("유저");
  const amount = interaction.options.getInteger("금액");

  // 보내는 사람 출석 체크
  if (sender.attendanceDays < 7) {
    return interaction.reply({
      content: "**출석 7일 이상부터 송금이 가능하다밍!**",
      flags: 64
    });
  }

  if (!targetUser) {
    return interaction.reply({
      content: "**송금할 유저를 찾을 수 없다밍!**",
      flags: 64
    });
  }

  if (targetUser.bot) {
    return interaction.reply({
      content: "**봇에게는 송금할 수 없다밍!!**",
      flags: 64
    });
  }

  if (targetUser.id === interaction.user.id) {
    return interaction.reply({
      content: "**자기 자신에게는 송금 못한다밍!**",
      flags: 64
    });
  }

  if (!amount || amount < 1000) {
    return interaction.reply({
      content: "**송금 금액은 최소 1,000원 이상부터 가능하다밍!!**",
      flags: 64
    });
  }

  const receiver = ensureUser(targetUser.id);
  resetDailyTransferLimit(receiver);

  // 받는 사람 출석 체크
  if (receiver.attendanceDays < 7) {
    return interaction.reply({
      content: "❌ **상대방의 출석일수가 7일 미만이라 받을 수 없다밍**",
      flags: 64
    });
  }

  const UNIT = 10000000;
  const useCount = Math.ceil(amount / UNIT);
  const remainingTransferCount = sender.transfer.maxCount - sender.transfer.usedCount;

  if (useCount > remainingTransferCount) {
    return interaction.reply({
      content: `❌ 하루 송금 횟수를 초과했다메엥!! (남은 횟수: ${remainingTransferCount}회)`,
      flags: 64
    });
  }

  const fee = Math.floor(amount * 0.05);
  const total = amount + fee;

  if (sender.money < total) {
    return interaction.reply({
      content:
        `❌ 잔액이 부족합니다.\n` +
        `송금액: ${amount.toLocaleString()}원\n` +
        `수수료: ${fee.toLocaleString()}원\n` +
        `총 필요 금액: ${total.toLocaleString()}원`,
      flags: 64
    });
  }

  sender.money -= total;
  receiver.money += amount;
  sender.transfer.usedCount += useCount;

  saveUsers();

  try {
    const dmEmbed = new EmbedBuilder()
      .setColor("#3B82F6")
      .setTitle("**🔔띵동~송금이 도착했다밍!**")
      .setDescription(

`**<@${interaction.user.id}> 님이 돈을 송금했다밍!**

<:money:1489876006893518968> **잔액**: ${receiver.money.toLocaleString()}원 (+${amount.toLocaleString()}원)`
      );

    await targetUser.send({
      embeds: [dmEmbed],
      allowedMentions: { parse: [] }
    });
  } catch (err) {
    console.log("송금 DM 실패:", err.message);
  }

  const embed = new EmbedBuilder()
    .setColor("#3B82F6")
    .setTitle("<:atm:1496118599297794120> 송금 완료")
    .setDescription(
`**<@${interaction.user.id}> 님이 <@${targetUser.id}> 님에게 ${amount.toLocaleString()}원을 보냈다밍!**

<@${interaction.user.id}>
<:money:1489876006893518968> **잔액**: ${sender.money.toLocaleString()}원 (-${total.toLocaleString()}원)

<@${targetUser.id}>
<:money:1489876006893518968> **잔액**: ${receiver.money.toLocaleString()}원 (+${amount.toLocaleString()}원)

**남은 횟수** : ${sender.transfer.maxCount - sender.transfer.usedCount}회`
    );

  return interaction.reply({
    content: "**송금 수수료는 5%다밍!**",
    embeds: [embed],
    allowedMentions: { parse: [] }
  });
}

/* ---------------- 통장잔고 ---------------- */
if (commandName === "통장잔고") {
  const user = ensureUser(id);

  const sortedUsers = Object.entries(users)
    .sort((a, b) => b[1].money - a[1].money);

  const rank = sortedUsers.findIndex(([uid]) => uid === id) + 1;


  const embed = new EmbedBuilder()
    .setColor("#3B82F6")
    .setTitle("<:bankbook:1496137848003363009> 통장잔고")
    .setDescription(
`**<@${interaction.user.id}> 님의 통장잔고다밍!**

<:money:1489876006893518968> **잔액**: ${user.money.toLocaleString()}원

**순위: ${rank}위**`
    );

  return interaction.reply({
    embeds: [embed],
  });
}

/* ---------------- 카페 ---------------- */
if (commandName === "카페") {
  const user = ensureUser(id);
  const today = new Date().toLocaleDateString("ko-KR");

  if (user.lastFarmResetDate !== today) {
    user.farmCount = 0;
    user.lastFarmResetDate = today;
    user.canGatherToday = false;
    saveUsers();
  }

  if (!user.canGatherToday) {
    return interaction.reply({
      content: "**농사를 30번 완료해야 카페를 할 수 있다밍**"
    });
  }

  const now = Date.now();
  let cooldown = 10 * 1000;
  cooldown = applyCooldownPet(user, cooldown);

  if (user.lastGatherAt && now - user.lastGatherAt < cooldown) {
    const remaining = Math.ceil((cooldown - (now - user.lastGatherAt)) / 1000);

    return interaction.reply({
      content: `**${remaining}초 후 다시 시도해달라밍!**`
    });
  }

  if (user.lastGatherResetDate !== today) {
    user.gatherCount = 0;
    user.lastGatherResetDate = today;
  }

  if (user.gatherCount >= 50) {
    return interaction.reply({
      content: "**오늘 카페 가능 횟수를 모두 사용했다밍!**"
    });
  }

  try {
    const { gatherData, successResults, failResults } = gatherSystem;
    const data = gatherData[user.gatherLevel];

    if (!data) {
      return interaction.reply({
        content: "**❌ 카페 데이터가 없다밍**",
        flags: 64
      });
    }

    let successChance = data.success;

    if (user.pet?.key === "snowman") {
      const pet = getPetByKey("snowman");
      let reduceValue = 0;

      if (pet?.option?.values) {
        const levels = Object.keys(pet.option.values)
          .map(Number)
          .sort((a, b) => b - a);

        for (const lvl of levels) {
          if ((user.pet.level || 1) >= lvl) {
            reduceValue = pet.option.values[lvl];
            break;
          }
        }
      }

      successChance = Math.min(100, data.success + (reduceValue * 100));
    }

    const roll = Math.random() * 100;

    let result;
    let expChange = 0;
    let moneyChange = 0;
    let bonusAmount = 0;
    let petBonusAmount = 0;
    let color = "#22c55e";
    let title = "카페 성공";

    if (roll < successChance) {
      result = successResults[Math.floor(Math.random() * successResults.length)];
      expChange = result.exp;

      const base = getRandomInt(result.min, result.max);
      bonusAmount = Math.floor(base * data.multiplier);
      moneyChange = base + bonusAmount;

      if (user.pet?.key === "rabbit") {
        const pet = getPetByKey("rabbit");
        let doubleChance = 0;

        if (pet?.option?.values) {
          const levels = Object.keys(pet.option.values)
            .map(Number)
            .sort((a, b) => b - a);

          for (const lvl of levels) {
            if ((user.pet.level || 1) >= lvl) {
              doubleChance = pet.option.values[lvl];
              break;
            }
          }
        }

        if (Math.random() * 100 < doubleChance) {
          petBonusAmount = base;
          moneyChange += petBonusAmount;
        }
      }

      user.money += moneyChange;
      color = "#22c55e";
      title = "카페 성공";
    } else {
      result = failResults[Math.floor(Math.random() * failResults.length)];
      expChange = result.exp;

      const base = getRandomInt(result.min, result.max);
      moneyChange = -base;

      user.money += moneyChange;
      color = "#ef4444";
      title = "카페 실패";
    }

    user.gatherExp += expChange;

    let newLevel = 1;

    for (let level = 2; level <= 10; level++) {
      const prevData = gatherData[level - 1];

      if (prevData.nextExp !== null && user.gatherExp >= prevData.nextExp) {
        newLevel = level;
      } else {
        break;
      }
    }

    user.gatherLevel = newLevel;
    user.gatherCount += 1;
    user.lastGatherAt = now;

    const remainingCount = 50 - user.gatherCount;
    const currentLevelEmoji = levelEmojis[user.gatherLevel] || "☕";

    const bonusText =
      moneyChange > 0
        ? `**레벨보너스 x${data.multiplier}: ${bonusAmount.toLocaleString()}원**`
        : "**레벨보너스: 없음**";

    const petBonusText =
      petBonusAmount > 0
        ? `**토토의 고유옵션 보너스: ${petBonusAmount.toLocaleString()}원**`
        : "";

    const expText =
      expChange === 0
        ? ""
        : `(${expChange > 0 ? "+" : ""}${expChange})`;

    const moneyText =
      moneyChange === 0
        ? ""
        : `(${moneyChange > 0 ? "+" : ""}${moneyChange.toLocaleString()}원)`;

    const embed = new EmbedBuilder()
      .setColor(color)
      .setDescription(
`# **${title}**

${result.message}

${bonusText}
${petBonusText}
**<:money:1489876006893518968> 잔액 : ${user.money.toLocaleString()}원 ${moneyText}**
**${currentLevelEmoji} 카페 경험치: ${user.gatherExp} ${expText}**
**남은횟수 : ${remainingCount}회**`
      );

    if (result.image) {
      embed.setImage(result.image);
    }

    saveUsers();

    return interaction.reply({
      embeds: [embed]
    });

  } catch (error) {
    console.error("카페 명령어 오류:", error);

    return interaction.reply({
      content: "❌ 카페 처리 중 오류가 발생했다밍",
      flags: 64
    });
  }
}

/* ---------------- 농사 ---------------- */
if (commandName === "농사") {
  const user = ensureUser(id);
  const now = Date.now();
  let cooldown = 30 * 1000;
  cooldown = applyCooldownPet(user, cooldown);
  const today = new Date().toLocaleDateString("ko-KR");

  if (user.lastFarmResetDate !== today) {
    user.farmCount = 0;
    user.lastFarmResetDate = today;
    user.canGatherToday = false;
  }

  if (user.farmCount >= 30) {
    return interaction.reply({
      content: "**오늘 농사 가능 횟수를 모두 사용했다밍!**",
    });
  }

  if (user.lastFarmAt && now - user.lastFarmAt < cooldown) {
    const remaining = Math.ceil((cooldown - (now - user.lastFarmAt)) / 1000);

    return interaction.reply({
      content: `**${remaining}초 후 다시 시도해달라밍!**`,
    });
  }

  const farmLevelData = farmSystem.levels[user.farmLevel];
  const currentLevelEmoji = levelEmojis[user.farmLevel] || "🌱";

  if (!farmLevelData) {
    return interaction.reply({
      content: "❌ **농사 데이터가 없다밍!**",
      ephemeral: true
    });
  }

  let successChance = farmLevelData.success;

  if (user.pet?.key === "snowman") {
    const pet = getPetByKey("snowman");
    let reduceValue = 0;

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          reduceValue = pet.option.values[lvl];
          break;
        }
      }
    }

    successChance = Math.min(100, farmLevelData.success + (reduceValue * 100));
  }

  const rand = Math.random() * 100;
  const isSuccess = rand <= successChance;

  let color = "#22c55e";
  let title = "**농사 결과**";
  let description = "";
  let thumbnailImage = null;
  let failImage = null;

  user.farmCount += 1;
  const remainingCount = 30 - user.farmCount;

  if (isSuccess) {
    const crop = pickFarmCrop(farmLevelData.crops);
    const cropKey = String(crop.key || "").trim();

    const cropInfo =
      cropsData[cropKey] ||
      (cropKey.toLowerCase() === "wildginseng" ? cropsData.wildGinseng : null) ||
      (cropKey.toLowerCase() === "shinemuscat" ? cropsData.shineMuscat : null);

    if (!cropInfo) {
      return interaction.reply({
        content: `❌ **'${cropKey}' 작물 데이터가 없다밍!**`,
        ephemeral: true
      });
    }

    if (user.farmCrops[cropKey] === undefined) {
      user.farmCrops[cropKey] = 0;
    }

    color = cropInfo.color || "#22c55e";
    thumbnailImage = cropInfo.image || null;

    user.farmCrops[cropKey] += crop.amount;
    user.farmExp += crop.exp;

    const total = user.farmCrops[cropKey];
    const cropEmoji = cropInfo.emoji || "🌾";

    let successMent = "";

    if (cropKey === "peach") {
      successMent = `${cropEmoji} **탐스럽게 익은 복숭아 ${crop.amount}개를 수확했다밍! 달콤한 향이 기분을 좋게 만든다밍!!**`;
    } else if (cropKey === "strawberry") {
      successMent = "**새콤달콤하게 잘 익은 딸기를 수확했다밍!**";
    } else if (cropKey === "shineMuscat") {
      successMent = "**손이 많이 가는 샤인머스켓이지만 정성 덕분에 무사히 수확에 성공했다밍!**";
    } else if (cropKey === "apple") {
      successMent = "**정성과 운이 모두 따라줘야 가능한 달콤한 사과를 수확했다밍! 혹시 당신은 농사 고수냐밍?!**";
    } else if (cropKey === "wildGinseng") {
      successMent = "**10년에 한 번 나올까 말까 한 귀한 삼을 마침내 수확했다밍! 오늘은 운이 엄청나게 따르는 날인 것 같다밍!!**";
    } else {
      successMent = `${cropEmoji} **${crop.amount}개를 수확했다밍!**`;
    }

    let newLevel = user.farmLevel;

    for (let level = 2; level <= 10; level++) {
      const prev = farmSystem.levels[level - 1];
      if (prev.nextExp !== null && user.farmExp >= prev.nextExp) {
        newLevel = level;
      } else {
        break;
      }
    }

    user.farmLevel = newLevel;

    const newLevelEmoji = levelEmojis[user.farmLevel] || "🌱";
    const cropText = `${cropEmoji}: **${total}개 (+${crop.amount}개)**`;
    const expText = `${newLevelEmoji} **농사경험치**: ${user.farmExp} (+${crop.exp})`;

    description =
`${successMent}

**획득한 작물**
${cropText}

${expText}`;
  } else {
    color = "#ef4444";
    title = "❌ **농사 실패**";
    thumbnailImage = "https://cdn.discordapp.com/attachments/1489933242948911154/1498341850673844354/ChatGPT_Image_2026_4_28_12_14_49.png";

    const lostMoney = Math.floor(Math.random() * (5000 - 1000 + 1)) + 1000;
    user.money -= lostMoney;

    description =
`**지속된 가뭄으로 땅이 바짝 말라버려, 수확에 실패했다밍ㅜ**

<:money:1489876006893518968> **잔액**: ${user.money.toLocaleString()}원 (-${lostMoney.toLocaleString()}원)
${currentLevelEmoji} **농사경험치**: ${user.farmExp} (+0)`;
  }

  if (user.farmCount >= 30) {
    user.canGatherToday = true;
  }

  user.lastFarmAt = now;
  saveUsers();

  const embed = new EmbedBuilder()
    .setColor(color || "#22c55e")
    .setTitle(title)
    .setDescription(
`${description}

**오늘 남은 농사 횟수**: ${remainingCount}회`
    );

  if (thumbnailImage && typeof thumbnailImage === "string" && thumbnailImage.trim() !== "") {
    embed.setThumbnail(thumbnailImage);
  }

  if (failImage && typeof failImage === "string" && failImage.trim() !== "") {
    embed.setImage(failImage);
  }

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 탐험 ---------------- */
if (commandName === "탐험") {
  await interaction.deferReply();

  const user = ensureUser(id);

  const today = new Date().toLocaleDateString("ko-KR");

  if (user.lastExploreResetDate !== today) {
    user.lastExploreResetDate = today;
    user.exploreCount = 0;
  }

  if (user.lastGatherResetDate !== today || user.gatherCount < 50) {
    return interaction.editReply({
      content: `**카페를 50번 모두 완료해야 할 수 있다밍!**`,
    });
  }

  if (user.exploreCount >= 100) {
    return interaction.editReply({
      content: "**오늘 가능한 탐험을 모두 완료했다밍!**",
    });
  }

  const now = Date.now();
  let cooldown = 5 * 1000;
  cooldown = applyCooldownPet(user, cooldown);

  const remainingCooldown = cooldown - (now - user.lastExploreAt);

  if (remainingCooldown > 0) {
    return interaction.editReply({
      content: `**탐험은 ${Math.ceil(remainingCooldown / 1000)}초 뒤에 다시 가능하다밍!**`,
    });
  }

  if (!user.inventory) user.inventory = {};
  if (user.inventory.repairStone === undefined) user.inventory.repairStone = 0;
  if (user.inventory.wildGinsengPiece === undefined) user.inventory.wildGinsengPiece = 0;

  user.exploreCount += 1;
  user.lastExploreAt = now;

  let repairChance = 0.1;

  if (user.pet?.key === "pig") {
    const pet = getPetByKey("pig");
    let petChance = 0.1;

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          petChance = pet.option.values[lvl];
          break;
        }
      }
    }

    repairChance = petChance;
  }

  const ginsengPieceChance = 0.05;
  const roll = Math.random() * 100;

  let title = "<:exploration:1500340743280001184> **탐험 결과**";
  let color = "#ff0800";
  let description = "";

  if (roll < ginsengPieceChance) {
    user.inventory.wildGinsengPiece += 1;

    color = "#f59e0b";
    description =
`**깊은 산기슭에서 묘한 향을 따라가 보니, 귀한 산삼조각이 모습을 드러냈다밍!**

<:piece:1500337696525254658> **산삼조각: ${user.inventory.wildGinsengPiece.toLocaleString()}개**
**남은 탐험 횟수: ${100 - user.exploreCount}회**`;
  }

  else if (roll < ginsengPieceChance + repairChance) {
    user.inventory.repairStone += 1;

    color = "#14b8a6";
    description =
`**깊은 동굴을 탐사하던 중, 장비 복원에 쓰이는 희귀한 수리석을 손에 넣었다밍!**

<:repair:1489875654886297640> **수리석: ${user.inventory.repairStone.toLocaleString()}개**
**남은 탐험 횟수: ${100 - user.exploreCount}회**`;
  }

  else {
    const failMessages = [
      "**분명 무언가 있을 것 같았지만, 오늘은 운이 따라주지 않았다밍…**",
      "**희귀한 기운을 느꼈지만, 착각이었던 듯하다밍…**",
      "**오랜 시간 탐험했지만, 오늘은 아무런 성과도 얻지 못했다밍…**"
    ];

    description =
`${failMessages[Math.floor(Math.random() * failMessages.length)]}

**남은 탐험 횟수: ${100 - user.exploreCount}회**`;
  }

  saveUsers();

  const embed = new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }));

  return interaction.editReply({
    embeds: [embed]
  });
}

/* ---------------- 공격 ---------------- */
if (commandName === "공격") {
  const user = ensureUser(id);
  const today = new Date().toLocaleDateString("ko-KR");

  if (user.lastAttackDate === today) {
    return interaction.reply({
      content: "**넌 이미 공격을 한 거 아니냐밍! 공격은 하루에 1번만 가능 하다밍!**",
    });
  }

  const beforeLevel = user.level;

  if (beforeLevel === 1) {
    return interaction.reply({
      content: "**나뭇가지로는 공격할 수 없다밍!**",
      ephemeral: true
    });
  }

  const beforeWeaponData = gameData.weapons["Lv" + beforeLevel];

  if (!beforeWeaponData) {
    return interaction.reply({
      content: `**Lv${beforeLevel} 무기 데이터가 없다밍!**`,
      ephemeral: true
    });
  }

  const bossInfo = getAttackBossInfo(beforeLevel);

  if (!bossInfo) {
    return interaction.reply({
      content: "**공격 보스 데이터를 찾을 수 없다밍!**",
      ephemeral: true
    });
  }

  let durabilityLoss = getRandomInt(
    bossInfo.minDurabilityLoss,
    bossInfo.maxDurabilityLoss
  );

  let bearReduce = 0;

  if (user.pet?.key === "bear") {
    const pet = getPetByKey("bear");

    if (pet?.option?.values) {
      const levels = Object.keys(pet.option.values)
        .map(Number)
        .sort((a, b) => b - a);

      for (const lvl of levels) {
        if ((user.pet.level || 1) >= lvl) {
          bearReduce = pet.option.values[lvl];
          break;
        }
      }
    }

    durabilityLoss = Math.max(0, durabilityLoss - bearReduce);
  }

  const engraveBonus = getEngraveBonusPercent(user.engraveLevel || 0);

  const baseReward = Math.floor((beforeWeaponData.sellPrice || 0) * 0.12);

  const engraveReward = Math.floor(
    (beforeWeaponData.sellPrice || 0) * (engraveBonus / 100)
  );

  const reward = baseReward + engraveReward;

  const bossKillText = `**${bossInfo.bossName}(를)을 처치했다밍!**`;
  const afterDurability = user.durability - durabilityLoss;

  user.money += reward;
  user.lastAttackDate = today;

  let embedColor = "#22c55e";
  let currentWeaponData = beforeWeaponData;
  let weaponText = "";
  let durabilityText = "";

  const bearText =
    bearReduce > 0
      ? `**꼬미의 고유옵션으로 내구도 감소량이 ${bearReduce}만큼 줄었다밍!**\n`
      : "";

  if (afterDurability <= 0) {
    const dropLevel = getRandomInt(1, 2);

    user.level = Math.max(1, user.level - dropLevel);
    user.durability = 100;

    currentWeaponData = gameData.weapons["Lv" + user.level] || beforeWeaponData;
    embedColor = "#ef4444";

    weaponText = `**Lv${user.level} 「${currentWeaponData.name}」**`;
    durabilityText = `**${user.durability} (-${durabilityLoss})**`;
  } else {
    user.durability = afterDurability;

    weaponText = `**Lv${user.level} 「${beforeWeaponData.name}」**`;
    durabilityText = `**${user.durability} (-${durabilityLoss})**`;
  }

  saveUsers();

  const embed = new EmbedBuilder()
    .setColor(embedColor)
    .setTitle("**공격성공**")
    .setDescription(
`${bossKillText}
<:money:1489876006893518968> **보상으로 얻은 금액이다밍!**
**${baseReward.toLocaleString()}원**

${engraveBonus > 0 ? `💫 **각인 보너스 +${engraveBonus}%**\n` : ""}${bearText}
<:money:1489876006893518968> **잔액:** ${user.money.toLocaleString()}원 (+${reward.toLocaleString()}원)

${weaponText}
**내구도:** ${durabilityText}`
    );

  if (currentWeaponData?.image) {
    embed.setImage(currentWeaponData.image);
  }

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 전리품 ---------------- */
if (commandName === "전리품") {
  await interaction.deferReply();

  const user = ensureUser(id);
  const now = Date.now();

  let cooldown = 3 * 60 * 60 * 1000; // 기본 3시간
  cooldown = applyCooldownPet(user, cooldown);

  if (user.lastLootAt && now - user.lastLootAt < cooldown) {
    const remainingMs = cooldown - (now - user.lastLootAt);
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

    return interaction.editReply({
      content: `**전리품 찾는 중이다밍••• ${hours}시간 ${minutes}분 ${seconds}초 후 다시 시도해달라밍!**`,
    });
  }

  const loot = getLootResult(user);

  user.money += loot.value;
  user.lastLootAt = now;
  saveUsers();

  logGameResult(
  interaction,
  `전리품 결과: ${loot.grade} / 획득:${loot.value.toLocaleString()}원 / 잔액:${user.money.toLocaleString()}원`
);

  const embed = new EmbedBuilder()
    .setColor(loot.color)
    .setTitle(`**${loot.emoji} ${loot.grade} 전리품**`)
    .setThumbnail(interaction.user.displayAvatarURL({ size: 256 }))
    .setDescription(
`${loot.message}

<:money:1489876006893518968> **잔액:** ${user.money.toLocaleString()}원 (+${loot.value.toLocaleString()}원)

**전리품의 쿨타임은 3시간이다밍!**`
    );

  return interaction.editReply({
    embeds: [embed]
  });
}

 /* ---------------- 작물개수 ---------------- */
if (commandName === "작물개수") {
  const user = ensureUser(id);

  const cropList = [
    { key: "peach", name: "복숭아", emoji: cropsData.peach?.emoji || "🍑" },
    { key: "strawberry", name: "딸기", emoji: cropsData.strawberry?.emoji || "🍓" },
    { key: "shineMuscat", name: "샤인머스켓", emoji: cropsData.shineMuscat?.emoji || "<:grape:1489872445555867759>" },
    { key: "apple", name: "사과", emoji: cropsData.apple?.emoji || "🍎" },
    { key: "wildGinseng", name: "산삼", emoji: cropsData.wildGinseng?.emoji || "<:wildGinseng:1489948179615977553>" }
  ];

  const cropText = cropList
    .map(crop => {
      const amount = user.farmCrops?.[crop.key] || 0;

      return `${crop.emoji} ${crop.name}
\`\`\`
${amount.toLocaleString()}개
\`\`\``;
    })
    .join(""); // 🔥 공백 제거 핵심

  const embed = new EmbedBuilder()
    .setColor("#ffffff")
    .setTitle("**작물 개수**")
    .setDescription(
`${cropText}
**농사 레벨** : ${user.farmLevel}`
    );

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 작물판매 ---------------- */
if (commandName === "작물판매") {
  const user = ensureUser(id);

  const cropKey = interaction.options.getString("작물");
  const amount = interaction.options.getInteger("개수");

  if (amount <= 0) {
    return interaction.reply({
      content: "❌ **판매 개수는 1개 이상이어야 한다밍!**",
      ephemeral: true
    });
  }

  const cropInfoMap = {
    peach: {
      name: "복숭아",
      emoji: cropsData.peach?.emoji || "🍑"
    },
    strawberry: {
      name: "딸기",
      emoji: cropsData.strawberry?.emoji || "🍓"
    },
    shineMuscat: {
      name: "샤인머스켓",
      emoji: cropsData.shineMuscat?.emoji || "<:grape:1489872445555867759>"
    },
    apple: {
      name: "사과",
      emoji: cropsData.apple?.emoji || "🍎"
    },
    wildGinseng: {
      name: "산삼",
      emoji: cropsData.wildGinseng?.emoji || "<:wildGinseng:1489948179615977553>"
    }
  };

  const cropInfo = cropInfoMap[cropKey];

  if (!cropInfo) {
    return interaction.reply({
      content: "❌ **잘못된 작물이다밍!**",
      ephemeral: true
    });
  }

  if (!user.farmCrops || user.farmCrops[cropKey] === undefined) {
    return interaction.reply({
      content: "❌ **보유한 작물 정보를 찾을 수 없다밍!**",
      ephemeral: true
    });
  }

  if (user.farmCrops[cropKey] < amount) {
    return interaction.reply({
      content: "❌ **보유한 작물 개수가 부족하다밍!**",
      ephemeral: true
    });
  }

  if (!marketState.market) {
    marketState.market = {};
  }

  if (Object.keys(marketState.market).length === 0) {
    marketState.market = updateMarket();
    marketState.lastUpdate = Date.now();
    saveMarket();
  }

  const price = Number(marketState.market[cropKey] || 0);

  if (price <= 0) {
    return interaction.reply({
      content: "❌ **현재 시세 정보를 불러올 수 없다밍!**",
      ephemeral: true
    });
  }

  const totalPrice = price * amount;

  user.farmCrops[cropKey] -= amount;
  user.money += totalPrice;
  saveUsers();

  const remainingAmount = user.farmCrops[cropKey];

  const embed = new EmbedBuilder()
    .setColor("#22c55e")
    .setTitle("**작물 판매 완료**")
    .setDescription(
`${cropInfo.emoji} **${cropInfo.name} ${amount.toLocaleString()}개를 판매했다밍!**

**개당 가격:** ${price.toLocaleString()}원
**판매 금액:** ${totalPrice.toLocaleString()}원

**남은 개수:** ${remainingAmount.toLocaleString()}개
<:money:1489876006893518968> **잔액:** ${user.money.toLocaleString()}원 (+${totalPrice.toLocaleString()}원)`
    );

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 작물구매 ---------------- */
if (commandName === "작물구매") {
  const user = ensureUser(id);

  const cropKey = interaction.options.getString("작물");
  const amount = interaction.options.getInteger("개수");

  if (amount <= 0) {
    return interaction.reply({
      content: "❌ **구매 개수는 1개 이상이어야 한다밍!**",
      ephemeral: true
    });
  }

  // ❌ 산삼 구매 금지
  if (cropKey === "wildGinseng") {
    return interaction.reply({
      content: "❌ **산삼은 구매할 수 없는 작물이다밍!**",
      ephemeral: true
    });
  }

  // 구매 제한
  const purchaseLimits = {
    peach: 20000,
    strawberry: 300,
    shineMuscat: 10,
    apple: 1
  };

  const maxAmount = purchaseLimits[cropKey];
  const currentAmount = user.farmCrops[cropKey] || 0;

  if (maxAmount !== undefined && currentAmount + amount > maxAmount) {
    const canBuy = Math.max(0, maxAmount - currentAmount);

    return interaction.reply({
      content: `❌ **현재 ${currentAmount.toLocaleString()}개 보유 중이라 ${canBuy.toLocaleString()}개까지만 구매할 수 있다밍!**`,
      ephemeral: true
    });
  }

  const cropInfoMap = {
    peach: {
      name: "복숭아",
      emoji: cropsData.peach?.emoji || "🍑"
    },
    strawberry: {
      name: "딸기",
      emoji: cropsData.strawberry?.emoji || "🍓"
    },
    shineMuscat: {
      name: "샤인머스켓",
      emoji: cropsData.shineMuscat?.emoji || "<:grape:1489872445555867759>"
    },
    apple: {
      name: "사과",
      emoji: cropsData.apple?.emoji || "🍎"
    }
  };

  const cropInfo = cropInfoMap[cropKey];

  if (!cropInfo) {
    return interaction.reply({
      content: "❌ **잘못된 작물이다밍!**",
      ephemeral: true
    });
  }

  // 시세 없으면 생성
  if (!marketState.market) {
    marketState.market = {};
  }

  if (Object.keys(marketState.market).length === 0) {
    marketState.market = updateMarket(marketState.market);
    marketState.lastUpdate = Date.now();
    saveMarket();
  }

  const price = Number(marketState.market[cropKey] || 0);

  if (price <= 0) {
    return interaction.reply({
      content: "❌ **현재 시세 정보를 불러올 수 없다밍!**",
      ephemeral: true
    });
  }

  const totalPrice = price * amount;

  if (user.money < totalPrice) {
    return interaction.reply({
      content: "❌ **돈이 부족하다밍!**",
      ephemeral: true
    });
  }

  // 구매 처리
  user.money -= totalPrice;
  user.farmCrops[cropKey] += amount;
  saveUsers();

  const newAmount = user.farmCrops[cropKey];

  const embed = new EmbedBuilder()
    .setColor("#3b82f6")
    .setTitle("**작물 구매 완료**")
    .setDescription(
`${cropInfo.emoji} **${cropInfo.name} ${amount.toLocaleString()}개를 구매했다밍!**

**개당 가격:** ${price.toLocaleString()}원
**구매 금액:** ${totalPrice.toLocaleString()}원

**보유 개수:** ${newAmount.toLocaleString()}개
<:money:1489876006893518968> **잔액:** ${user.money.toLocaleString()}원 (-${totalPrice.toLocaleString()}원)`
    );

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 작물시세 ---------------- */
if (commandName === "작물시세") {
  try {
    const now = Date.now();
    const marketCooldown = 30 * 1000;

    if (!marketState.market) marketState.market = {};
    if (marketState.lastUpdate === undefined) marketState.lastUpdate = 0;

    if (!marketState.lastUpdate || now - marketState.lastUpdate >= marketCooldown) {
      if (Object.keys(marketState.market).length === 0) {
        marketState.market = generateMarket();
      } else {
        marketState.market = updateMarket(marketState.market);
      }

      marketState.lastUpdate = now;
      saveMarket();
    }

    const m = marketState.market;

    const cropList = [
      {
        key: "peach",
        name: "복숭아",
        emoji: cropsData.peach?.emoji || "🍑"
      },
      {
        key: "strawberry",
        name: "딸기",
        emoji: cropsData.strawberry?.emoji || "🍓"
      },
      {
        key: "shineMuscat",
        name: "샤인머스켓",
        emoji: cropsData.shineMuscat?.emoji || "<:grape:1489872445555867759>"
      },
      {
        key: "apple",
        name: "사과",
        emoji: cropsData.apple?.emoji || "🍎"
      },
      {
        key: "wildGinseng",
        name: "산삼",
        emoji: cropsData.wildGinseng?.emoji || "<:wildGinseng:1489948179615977553>"
      }
    ];

    const marketText = cropList
      .map(crop => {
        const price = Number(m[crop.key] || 0);

        return `${crop.emoji} **${crop.name}**
\`\`\`
${price.toLocaleString()}원
\`\`\``;
      })
      .join("");

    const embed = new EmbedBuilder()
      .setColor("#2b2d31")
      .setTitle("**작물 시세**")
      .setDescription(marketText);

    return interaction.reply({
      embeds: [embed]
    });
  } catch (error) {
    console.error("/시세 오류:", error);

    if (interaction.replied || interaction.deferred) {
      return interaction.followUp({
        content: "❌ **시세 명령어 실행 중 오류가 발생했다밍!**",
        ephemeral: true
      });
    }

    return interaction.reply({
      content: "❌ **시세 명령어 실행 중 오류가 발생했다밍!**",
      ephemeral: true
    });
  }
}

/* ---------------- 복권 ---------------- */
if (commandName === "복권") {
  if (activeInteractions.has(id)) {
    return interaction.reply({
      content: "❌ **이미 진행 중이다밍!**",
      flags: 64
    });
  }

  const user = ensureUser(id);
  const now = Date.now();

  let cooldown = 60 * 60 * 1000; // 기본 1시간
  cooldown = applyCooldownPet(user, cooldown);

  if (user.lastLottoAt && now - user.lastLottoAt < cooldown) {
    const remainingMs = cooldown - (now - user.lastLottoAt);
    const hours = Math.floor(remainingMs / (60 * 60 * 1000));
    const minutes = Math.floor((remainingMs % (60 * 60 * 1000)) / (60 * 1000));
    const seconds = Math.floor((remainingMs % (60 * 1000)) / 1000);

    return interaction.reply({
      content: `**복권은 ${hours}시간 ${minutes}분 ${seconds}초 후 다시 시도할 수 있다밍!**`,
    });
  }

  activeInteractions.add(id);

  const row = new ActionRowBuilder().addComponents(
    new ButtonBuilder()
      .setCustomId("lotto_sheep")
      .setLabel("🐑")
      .setStyle(ButtonStyle.Primary),

    new ButtonBuilder()
      .setCustomId("lotto_wolf")
      .setLabel("🐺")
      .setStyle(ButtonStyle.Primary)
  );

  const embed = new EmbedBuilder()
    .setColor("#5865F2")
    .setTitle("**복권**")
    .setDescription(
`**미닝봇이 어떤 선택을 할지 맞혀보라밍!**
**정답을 맞히면 소소한 보상이 주어진다밍!**

**1분 동안 작동이 없으면 창이 자동으로 닫힌다밍!**`
    );

  const msg = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true
  });

  const collector = msg.createMessageComponentCollector({
    idle: 60000
  });

  collector.on("end", async (collected) => {
    if (collected.size > 0) return;

    try {
      activeInteractions.delete(id);

      user.lastLottoAt = Date.now();
      saveUsers();

      const closedEmbed = new EmbedBuilder()
        .setColor("#9CA3AF")
        .setDescription(
`ㅤ
**1분 동안 선택하지 않아 복권 창이 자동으로 닫혔다밍!**
**복권은 쿨타임 후 다시 가능하다밍!**
ㅤ`
        );

      await msg.edit({
        embeds: [closedEmbed],
        components: []
      });
    } catch (err) {
      console.log("복권 자동 종료 오류:", err.message);
    }
  });
}
/* ---------------- 상점 ---------------- */
if (commandName === "상점") {
  const user = ensureUser(id);
  resetDailyShopLimit(user);
  saveUsers();

  const embed = buildShopEmbed(user);
  const selectMenu = buildShopSelectMenu(user);
  const row = new ActionRowBuilder().addComponents(selectMenu);

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

/* ---------------- 펫상점 ---------------- */
if (commandName === "펫상점") {
  const user = ensureUser(id);

  const embed = buildPetShopEmbed(user);

  const row = new ActionRowBuilder().addComponents(
    buildPetShopSelectMenu(user)
  );

  return interaction.reply({
    embeds: [embed],
    components: [row]
  });
}

/* ---------------- 펫정보 ---------------- */
if (commandName === "펫정보") {
  const user = ensureUser(id);

  updatePetHunger(user);

if ((user.pet?.hunger ?? 100) <= 0) {
    user.pet = {
      key: null,
      level: 1,
      optionChoice: null,
      hunger: 0,
      lastHungerAt: 0
    };

    saveUsers();

    return interaction.reply({
      content: "**펫이 배고픔을 이겨내지 못하고 결국 주인을 떠나버렸다밍..🥺**"
    });
  }

  if (!user.pet?.key) {
    return interaction.reply({
      content: "❌ **현재 보유 중인 펫이 없다밍!**",
      flags: 64
    });
  }

  const buffer = await drawPetInfoImage(user);

  const attachment = new AttachmentBuilder(buffer, {
    name: "pet-info.png"
  });

  return interaction.reply({
    files: [attachment]
  });
}

/* ---------------- 별의각인 ---------------- */
if (commandName === "별의각인") {
  const user = ensureUser(id);

  // 각인 레벨 없으면 0
  if (user.engraveLevel === undefined) {
    user.engraveLevel = 0;
  }

  // 이미 30단계면 종료
  if (user.engraveLevel >= 30) {
    return interaction.reply({
      content: "🏆 **별의각인 최대 단계다밍!**",
      flags: 64
    });
  }

  const nextLevel = user.engraveLevel + 1;
  const data = engraveData[nextLevel];

  if (!data) {
    return interaction.reply({
      content: "❌ **별의각인 데이터가 없다밍!**",
      flags: 64
    });
  }

  const stoneCount = user.inventory?.engraveStone || 0;
  const weaponData = gameData.weapons["Lv" + user.level];
  const starText = getEngraveStars(user.engraveLevel);

  // 각인석 부족일 때
  if (stoneCount < data.stone) {
    const lackEmbed = new EmbedBuilder()
      .setColor("#ef4444")
      .setTitle("💫 **별의각인**")
      .setDescription(
`${starText ? `${starText}\n\n` : ""}**현재 각인 단계**
**Lv.${user.engraveLevel}**

**다음 단계**
**Lv.${nextLevel}**

❌ **각인석이 부족하여 별의각인을 할 수 없다밍!**
**필요 각인석: ${data.stone}개**`
      )
      .setImage(weaponData?.image || null);

    return interaction.reply({
      embeds: [lackEmbed],
      flags: 64
    });
  }

  // 각인석 충분할 때
  const embed = new EmbedBuilder()
    .setColor("#8b5cf6")
    .setTitle("💫 **별의각인**")
    .setDescription(
`${starText ? `${starText}\n\n` : ""}**현재 각인 단계**
**Lv.${user.engraveLevel}**

**다음 단계**
**Lv.${nextLevel}**

**성공:** ${data.success}%
**유지:** ${data.keep}%
**파괴:** ${data.destroy}%

**필요 각인석:** ${data.stone}개
**보유 각인석:** ${stoneCount}개

**1분 동안 작동이 없으면 창이 자동으로 닫힌다밍!**`
    )
    .setImage(weaponData?.image || null);

  const engraveButton = new ButtonBuilder()
    .setCustomId("engrave_upgrade")
    .setLabel("각인 시도")
    .setStyle(ButtonStyle.Primary);

  const stopButton = new ButtonBuilder()
    .setCustomId("stop")
    .setLabel("그만하기")
    .setStyle(ButtonStyle.Danger);

  const row = new ActionRowBuilder().addComponents(engraveButton, stopButton);

  const msg = await interaction.reply({
    embeds: [embed],
    components: [row],
    fetchReply: true
  });

  const collector = msg.createMessageComponentCollector({
    idle: 60000
  });

  engraveCollectors.set(id, collector);

  collector.on("end", async (collected, reason) => {
    if (reason === "stopped") return;

    try {
      engraveCollectors.delete(id);

      const closedEmbed = new EmbedBuilder()
        .setColor("#9CA3AF")
        .setDescription(
`ㅤ
**1분 동안 작동하지 않아 창이 자동으로 닫혔다밍!**
ㅤ`
        );

      await msg.edit({
        embeds: [closedEmbed],
        components: []
      });
    } catch (err) {
      console.log("별의각인 자동 종료 오류:", err.message);
    }
  });
}

/* ---------------- 쿠폰사용 ---------------- */
if (commandName === "쿠폰사용") {
  const modal = new ModalBuilder()
    .setCustomId("coupon_use_modal")
    .setTitle("쿠폰");

  const couponInput = new TextInputBuilder()
    .setCustomId("coupon_code")
    .setLabel("쿠폰 코드를 입력해달라밍!")
    .setStyle(TextInputStyle.Short)
    .setRequired(true);

  const row = new ActionRowBuilder().addComponents(couponInput);

  modal.addComponents(row);

  return interaction.showModal(modal);
}

/* ---------------- 관리자 명령어 권한 체크 ---------------- */
const adminCommands = [
  "무기지급",
  "무기초기화",
  "돈지급",
  "돈초기화",
  "정보초기화",
  "아이템지급",
  "경험치지급",
  "경험치초기화",
  "가방확인",
  "쿠폰생성"
];

if (adminCommands.includes(commandName)) {
  if (!isAdmin(id)) {
    return interaction.reply({
      content: "⛔ 관리자 전용 명령어입니다.",
      ephemeral: true
    });
  }
}

/* ---------------- 무기지급 ---------------- */
if (commandName === "무기지급") {
  const target = interaction.options.getUser("유저");
  const level = interaction.options.getInteger("레벨");

  if (level < 1 || level > 50) {
    return interaction.reply({
      content: "❌ 무기 레벨은 1 ~ 50 사이만 가능합니다.",
      ephemeral: true
    });
  }

  const targetUser = ensureUser(target.id);
  targetUser.level = level;
  targetUser.durability = 100;

  saveUsers();

  return interaction.reply({
    content: `${target.username}님의 무기를 Lv${level}(으)로 지급했습니다.`,
    ephemeral: true
  });
}

/* ---------------- 무기초기화 ---------------- */
if (commandName === "무기초기화") {
  const target = interaction.options.getUser("유저");
  const targetUser = ensureUser(target.id);

  targetUser.level = 1;
  targetUser.durability = 100;

  saveUsers();

  return interaction.reply({
    content: `${target.username}님의 무기를 Lv1으로 초기화했습니다.`,
    ephemeral: true
  });
}

/* ---------------- 돈지급 ---------------- */
if (commandName === "돈지급") {
  const target = interaction.options.getUser("유저");
  const amount = interaction.options.getInteger("금액");

  if (amount <= 0) {
    return interaction.reply({
      content: "❌ 지급 금액은 1원 이상이어야 합니다.",
      ephemeral: true
    });
  }

  const targetUser = ensureUser(target.id);
  targetUser.money += amount;

  saveUsers();

  return interaction.reply({
    content: `${target.username}님에게 ${amount.toLocaleString()}원을 지급했습니다.`,
    ephemeral: true
  });
}

/* ---------------- 돈초기화 ---------------- */
if (commandName === "돈초기화") {
  const target = interaction.options.getUser("유저");
  const targetUser = ensureUser(target.id);

  targetUser.money = 0;

  saveUsers();

  return interaction.reply({
    content: `${target.username}님의 잔액을 0으로 초기화했습니다.`,
    ephemeral: true
  });
}

/* ---------------- 정보초기화 ---------------- */
if (commandName === "정보초기화") {
  const target = interaction.options.getUser("유저");

  users[target.id] = JSON.parse(JSON.stringify(defaultUser));
  users[target.id].money = 0;

  saveUsers();

  return interaction.reply({
    content: `${target.username}님의 정보를 전체 초기화했습니다.`,
    ephemeral: true
  });
}

/* ---------------- 아이템지급 ---------------- */
if (commandName === "아이템지급") {
  const target = interaction.options.getUser("유저");
  const itemKey = interaction.options.getString("아이템");
  const amount = interaction.options.getInteger("수량");

  if (amount <= 0) {
    return interaction.reply({
      content: "❌ 지급 수량은 1개 이상이어야 합니다.",
      ephemeral: true
    });
  }

  const itemMap = {
    repairStone: "수리석",
    engraveStone: "별의 각인",
    questionBox: "물음표박스",
    depositDoubleCoupon: "송금 더블 쿠폰",
    randomTransferCoupon: "송금 랜덤 쿠폰",
    wildGinsengPiece: "산삼조각"
  };

  if (!itemMap[itemKey]) {
    return interaction.reply({
      content: "❌ 존재하지 않는 아이템입니다.",
      ephemeral: true
    });
  }

  const targetUser = ensureUser(target.id);

  if (!targetUser.inventory) {
    targetUser.inventory = {};
  }

  if (targetUser.inventory[itemKey] === undefined) {
    targetUser.inventory[itemKey] = 0;
  }

  targetUser.inventory[itemKey] += amount;

  saveUsers();

  return interaction.reply({
    content: `${target.username}님에게 ${itemMap[itemKey]} ${amount.toLocaleString()}개를 지급했습니다.`,
    ephemeral: true
  });
}

/* ---------------- 경험치지급 ---------------- */
if (commandName === "경험치지급") {
  const target = interaction.options.getUser("유저");
  const expType = interaction.options.getString("종류");
  const amount = interaction.options.getInteger("수량");

  if (amount <= 0) {
    return interaction.reply({
      content: "❌ 지급 경험치는 1 이상이어야 합니다.",
      ephemeral: true
    });
  }

  const targetUser = ensureUser(target.id);

  if (expType === "farm") {
    targetUser.farmExp += amount;

    let newLevel = targetUser.farmLevel;

    for (let level = 2; level <= 10; level++) {
      const prev = farmSystem.levels[level - 1];

      if (prev.nextExp !== null && targetUser.farmExp >= prev.nextExp) {
        newLevel = level;
      } else {
        break;
      }
    }

    targetUser.farmLevel = newLevel;
    saveUsers();

    return interaction.reply({
      content: `${target.username}님에게 농사 경험치 ${amount.toLocaleString()}을 지급했다밍.`,
      ephemeral: true
    });
  }

  if (expType === "gather") {
    targetUser.gatherExp += amount;

    let newLevel = targetUser.gatherLevel;

   const { gatherData } = gatherSystem;

for (let level = 2; level <= 10; level++) {
  const prev = gatherData[level - 1];

  if (prev && prev.nextExp !== null && targetUser.gatherExp >= prev.nextExp) {
    newLevel = level;
  } else {
    break;
  }
}

    targetUser.gatherLevel = newLevel;
    saveUsers();

    return interaction.reply({
      content: `${target.username}님에게 카페 경험치 ${amount.toLocaleString()}을 지급했다밍.`,
      ephemeral: true
    });
  }

  return interaction.reply({
    content: "❌ 경험치 종류가 올바르지 않습니다.",
    ephemeral: true
  });
}

/* ---------------- 경험치초기화 ---------------- */
if (commandName === "경험치초기화") {
  const target = interaction.options.getUser("유저");
  const expType = interaction.options.getString("종류");

  const targetUser = ensureUser(target.id);

  if (expType === "farm") {
    targetUser.farmExp = 0;
    targetUser.farmLevel = 1;

    saveUsers();

    return interaction.reply({
      content: `${target.username}님의 농사 경험치와 농사 레벨을 초기화했습니다.`,
      ephemeral: true
    });
  }

  if (expType === "gather") {
    targetUser.gatherExp = 0;
    targetUser.gatherLevel = 1;

    saveUsers();

    return interaction.reply({
      content: `${target.username}님의 카페 경험치와 카페 레벨을 초기화했다밍.`,
      ephemeral: true
    });
  }

  return interaction.reply({
    content: "❌ 경험치 종류가 올바르지 않습니다.",
    ephemeral: true
  });
}

/* ---------------- 각인설정 ---------------- */
if (commandName === "각인설정") {

  if (!isAdmin(id)) {
    return interaction.reply({
      content: "❌ 관리자만 사용할 수 있다밍!",
      ephemeral: true
    });
  }

  const target = interaction.options.getUser("유저");
  const level = interaction.options.getInteger("레벨");

  const targetUser = ensureUser(target.id);

  targetUser.engraveLevel = level;

  saveUsers();
  const embed = new EmbedBuilder()
    .setColor("#8b5cf6")
    .setTitle("💫 각인 설정 완료")
    .setDescription(
`${target}님의 별의각인을 ${level}강으로 설정했다밍!`
    );

  return interaction.reply({
    embeds: [embed]
  });
}

/* ---------------- 가방확인 ---------------- */
if (commandName === "가방확인") {
  const target = interaction.options.getUser("유저");
  const targetUser = ensureUser(target.id);
  const inv = targetUser.inventory || {};

  const embed = new EmbedBuilder()
    .setColor("#64748b")
    .setTitle(`💼 ${target.username}님의 가방`)
    .setDescription(
`<:repair:1489875654886297640> 수리석: ${inv.repairStone || 0}개
💫 각인석: ${inv.engraveStone || 0}개
<:box:1492879878838816849> 물음표박스: ${inv.questionBox || 0}개

<:coupon:1496892441213665492> 송금 더블 쿠폰: ${inv.depositDoubleCoupon || 0}개
<:coupon2:1497620249766268938> 송금 랜덤 쿠폰: ${inv.randomTransferCoupon || 0}개
<:piece:1500337696525254658> 산삼조각: ${inv.wildGinsengPiece || 0}개`
    );

  return interaction.reply({
    embeds: [embed],
    ephemeral: true
  });
}

/* ---------------- 쿠폰생성 ---------------- */
if (commandName === "쿠폰생성") {
  const code = interaction.options.getString("코드").toUpperCase();
  const type = interaction.options.getString("종류");
  const key = interaction.options.getString("항목");
  const amount = interaction.options.getInteger("수량");
  const maxUse = interaction.options.getInteger("개수");
  const expireDays = interaction.options.getInteger("유효기간");

  if (!code || code.trim() === "") {
    return interaction.reply({
      content: "❌ 쿠폰 코드를 입력해야 합니다.",
      ephemeral: true
    });
  }

  if (amount <= 0 || maxUse <= 0 || expireDays <= 0) {
    return interaction.reply({
      content: "❌ 수량, 쿠폰 개수, 유효기간은 1 이상이어야 합니다.",
      ephemeral: true
    });
  }

  if (coupons[code]) {
    return interaction.reply({
      content: "❌ 이미 존재하는 쿠폰 코드입니다.",
      ephemeral: true
    });
  }

  const itemMap = {
    repairStone: "수리석",
    engraveStone: "별의 각인",
    questionBox: "물음표박스",
    depositDoubleCoupon: "송금 더블 쿠폰",
    randomTransferCoupon: "송금 랜덤 쿠폰",
    wildGinsengPiece: "산삼조각"
  };

  const cropMap = {
    peach: "복숭아",
    strawberry: "딸기",
    shineMuscat: "샤인머스켓",
    apple: "사과",
    wildGinseng: "산삼"
  };

  if (type === "item" && !itemMap[key]) {
    return interaction.reply({
      content: "❌ 존재하지 않는 아이템입니다.",
      ephemeral: true
    });
  }

  if (type === "crop" && !cropMap[key]) {
    return interaction.reply({
      content: "❌ 존재하지 않는 작물입니다.",
      ephemeral: true
    });
  }

  if (type !== "money" && type !== "item" && type !== "crop") {
    return interaction.reply({
      content: "❌ 쿠폰 종류가 올바르지 않습니다.",
      ephemeral: true
    });
  }

  const expireAt = Date.now() + expireDays * 24 * 60 * 60 * 1000;

  coupons[code] = {
    type,
    key: type === "money" ? null : key,
    amount,
    maxUse,
    usedCount: 0,
    expireAt,
    usedBy: []
  };

  saveCoupons();

  return interaction.reply({
    content: "✅ 쿠폰생성이 완료되었습니다.",
    ephemeral: true
  });
}
});

/* ---------------- 입장 로그 ---------------- */
client.on("guildMemberAdd", async (member) => {
  const channel = member.guild.channels.cache.get(JOIN_LOG_CHANNEL_ID);
  if (!channel) return;

  const memberCount = member.guild.memberCount;

  const embed = new EmbedBuilder()
    .setColor("#585858")
    .setTitle("**유저입장**")
    .setDescription(
`${member}님이 서버에 ${memberCount.toLocaleString()}번째로 입장했습니다.

**유저아이디**
\`${member.user.username}\`

**서버 가입일**
<t:${Math.floor(member.joinedTimestamp / 1000)}:F>

**계정 생성일**
<t:${Math.floor(member.user.createdTimestamp / 1000)}:F>`
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }));

  channel.send({ embeds: [embed] });
});

/* ---------------- 퇴장 로그 ---------------- */
client.on("guildMemberRemove", async (member) => {
  const channel = member.guild.channels.cache.get(LEAVE_LOG_CHANNEL_ID);
  if (!channel) return;

  const now = Math.floor(Date.now() / 1000);

  const embed = new EmbedBuilder()
    .setColor("#585858")
    .setTitle("유저퇴장")
    .setDescription(
`${member}님이 서버에서 퇴장했습니다.

**유저아이디**
\`${member.user.username}\`

**서버에서 나간 시간**
<t:${now}:F>`
    )
    .setThumbnail(member.user.displayAvatarURL({ size: 256 }));

  channel.send({ embeds: [embed] });
});

function writeErrorLog(type, message) {
  appendCsvLine(
    ERROR_LOG_FILE,
    ["시간", "종류", "메시지"],
    [
      formatLogTime(),
      type,
      String(message)
        .replace(/\n/g, " ")
    ]
  );
}

process.on("unhandledRejection", (reason) => {
  console.error(reason);

  writeErrorLog(
    "UnhandledRejection",
    reason.stack || reason
  );
});

process.on("uncaughtException", (err) => {
  console.error(err);

  writeErrorLog(
    "UncaughtException",
    err.stack || err
  );
});

client.login(process.env.TOKEN);