const farmData = {
  levels: {
    1: {
      success: 70,
      fail: 30,
      nextExp: 150,
      crops: [
        { key: "peach", name: "복숭아", amount: 1, chance: 70, exp: 1 },
        { key: "peach", name: "복숭아", amount: 3, chance: 15, exp: 3 },
        { key: "peach", name: "복숭아", amount: 5, chance: 10, exp: 5 },
        { key: "strawberry", name: "딸기", amount: 1, chance: 4.6, exp: 10 },
        { key: "shineMuscat", name: "샤인머스켓", amount: 1, chance: 0.39, exp: 20 },
        { key: "apple", name: "사과", amount: 1, chance: 0.009, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 0.001, exp: 1000 }
      ]
    },

    2: {
      success: 75,
      fail: 25,
      nextExp: 1000,
      crops: [
        { key: "peach", name: "복숭아", amount: 1, chance: 50, exp: 1 },
        { key: "peach", name: "복숭아", amount: 3, chance: 30, exp: 3 },
        { key: "peach", name: "복숭아", amount: 5, chance: 14, exp: 5 },
        { key: "strawberry", name: "딸기", amount: 1, chance: 5.5, exp: 10 },
        { key: "shineMuscat", name: "샤인머스켓", amount: 1, chance: 0.48, exp: 20 },
        { key: "apple", name: "사과", amount: 1, chance: 0.015, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 0.005, exp: 1000 }
      ]
    },

    3: {
      success: 80,
      fail: 20,
      nextExp: 5000,
      crops: [
        { key: "peach", name: "복숭아", amount: 1, chance: 15, exp: 1 },
        { key: "peach", name: "복숭아", amount: 3, chance: 40, exp: 3 },
        { key: "peach", name: "복숭아", amount: 5, chance: 25, exp: 5 },
        { key: "strawberry", name: "딸기", amount: 1, chance: 15.4, exp: 10 },
        { key: "shineMuscat", name: "샤인머스켓", amount: 1, chance: 4.5, exp: 20 },
        { key: "apple", name: "사과", amount: 1, chance: 0.09, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 0.01, exp: 1000 }
      ]
    },

    4: {
      success: 85,
      fail: 15,
      nextExp: 20000,
      crops: [
        { key: "peach", name: "복숭아", amount: 1, chance: 5, exp: 1 },
        { key: "peach", name: "복숭아", amount: 3, chance: 15, exp: 3 },
        { key: "peach", name: "복숭아", amount: 5, chance: 50, exp: 5 },
        { key: "strawberry", name: "딸기", amount: 1, chance: 19.8, exp: 10 },
        { key: "shineMuscat", name: "샤인머스켓", amount: 1, chance: 10, exp: 20 },
        { key: "apple", name: "사과", amount: 1, chance: 0.15, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 0.05, exp: 1000 }
      ]
    },

    5: {
      success: 90,
      fail: 10,
      nextExp: 50000,
      crops: [
        { key: "peach", name: "복숭아", amount: 3, chance: 1, exp: 3 },
        { key: "peach", name: "복숭아", amount: 5, chance: 39, exp: 5 },
        { key: "strawberry", name: "딸기", amount: 1, chance: 39.5, exp: 10 },
        { key: "shineMuscat", name: "샤인머스켓", amount: 1, chance: 20, exp: 20 },
        { key: "apple", name: "사과", amount: 1, chance: 0.4, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 0.1, exp: 1000 }
      ]
    },

    6: {
      success: 100,
      fail: 0,
      nextExp: 120000,
      crops: [
        { key: "peach", name: "복숭아", amount: 5, chance: 10, exp: 5 },
        { key: "strawberry", name: "딸기", amount: 1, chance: 62, exp: 10 },
        { key: "shineMuscat", name: "샤인머스켓", amount: 1, chance: 25, exp: 20 },
        { key: "apple", name: "사과", amount: 1, chance: 2.5, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 0.5, exp: 1000 }
      ]
    },

    7: {
      success: 100,
      fail: 0,
      nextExp: 200000,
      crops: [
        { key: "strawberry", name: "딸기", amount: 1, chance: 40, exp: 10 },
        { key: "shineMuscat", name: "샤인머스켓", amount: 1, chance: 50, exp: 20 },
        { key: "apple", name: "사과", amount: 1, chance: 9, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 1, exp: 1000 }
      ]
    },

    8: {
      success: 100,
      fail: 0,
      nextExp: 500000,
      crops: [
        { key: "strawberry", name: "딸기", amount: 1, chance: 10, exp: 10 },
        { key: "shineMuscat", name: "샤인머스켓", amount: 1, chance: 60, exp: 20 },
        { key: "apple", name: "사과", amount: 1, chance: 25, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 5, exp: 1000 }
      ]
    },

    9: {
      success: 100,
      fail: 0,
      nextExp: 900000,
      crops: [
        { key: "shineMuscat", name: "샤인머스켓", amount: 1, chance: 50, exp: 20 },
        { key: "apple", name: "사과", amount: 1, chance: 40, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 10, exp: 1000 }
      ]
    },

    10: {
      success: 100,
      fail: 0,
      nextExp: 999999999,
      crops: [
        { key: "apple", name: "사과", amount: 1, chance: 70, exp: 200 },
        { key: "wildGinseng", name: "산삼", amount: 1, chance: 30, exp: 1000 }
      ]
    }
  }
};

module.exports = farmData;