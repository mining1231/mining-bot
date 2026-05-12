const gatherData = {
  1: { nextExp: 100, success: 70, multiplier: 0 },
  2: { nextExp: 500, success: 75, multiplier: 3 },
  3: { nextExp: 1500, success: 80, multiplier: 10 },
  4: { nextExp: 5000, success: 85, multiplier: 30 },
  5: { nextExp: 10000, success: 90, multiplier: 60 },
  6: { nextExp: 20000, success: 95, multiplier: 100 },
  7: { nextExp: 50000, success: 100, multiplier: 300 },
  8: { nextExp: 100000, success: 100, multiplier: 600 },
  9: { nextExp: 200000, success: 100, multiplier: 1000 },
  10: { nextExp: 999999999, success: 100, multiplier: 2000 }
};

const successResults = [
  {
    message: "**시원한 딸기 스무디를 만들었다밍! 더운 날씨 덕분에 손님들이 많이 찾아줘서 잘 팔렸다밍!**",
    exp: 1,
    min: 1000,
    max: 10000,
    image:"https://cdn.discordapp.com/attachments/1489196186442137712/1498579418191233104/e45873d4502aad16.png"
  },
  {
    message: "**새콤달콤한 복숭아 타르트를 만들었다밍! 식후 디저트로 손님들이 많이 찾아줘서 인기 있게 잘 팔렸다밍!**",
    exp: 1,
    min: 1000,
    max: 10000,
    image:"https://cdn.discordapp.com/attachments/1489196186442137712/1498579445722910781/912968e789203801.png"
  },
  {
    message: "**달짝지근한 샤인머스켓 케이크를 만들었다밍! 손님들이 특히 많이 찾는 우리 카페의 베스트 메뉴라 더 인기 있게 팔렸다밍!**",
    exp: 2,
    min: 10000,
    max: 30000,
    image:"https://cdn.discordapp.com/attachments/1489196186442137712/1498579476957630494/e2b3d81bca0d4527.png"
  },
  {
    message: "**단골분들이 늘 찾아주는 사과파이를 완성했다밍! 단골 손님들이 계속 찾는 데에는 다 이유가 있는 인기 메뉴다밍!**",
    exp: 3,
    min: 30000,
    max: 50000,
    image:"https://cdn.discordapp.com/attachments/1489196186442137712/1498579508335345724/c72c2c887db3bb34.png"
  }
];

const failResults = [
  {
    message: "**복숭아 타르트를 굽다가 오븐에 넣어둔 걸 깜빡해서 전부 타버리고 말았다밍…**",
    exp: -2,
    min: 1000,
    max: 3000,
    image:"https://cdn.discordapp.com/attachments/1489196186442137712/1498579531353690252/ae74c0b2dbe2f70e.png"
  },
  {
    message: "**진열되어 있던 케이크를 꺼내다가 손이 미끄러져 그만 전부 쏟아버리고 말았다밍…**",
    exp: -3,
    min: 1000,
    max: 3000,
    image:"https://cdn.discordapp.com/attachments/1489196186442137712/1498579559266783292/79baca1793b88538.png"
  }
];

module.exports = {
  gatherData,
  successResults,
  failResults
};