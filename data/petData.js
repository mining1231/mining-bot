const petData = {
  D: [
    {
      key: "dust",
      name: "먼지",
      nickname: "탄이",
      grade: "D",
      image: "./assets/pets/tani.png",
      summonText: "**바람결이 살짝 흔들리고 어디선가 탄이가 굴러와 내앞에 멈췄다.**",

      option: {
        type: "attendanceDouble",
        values: {
          1: 2,
          10: 4,
          20: 7,
          30: 10
        }
      }
    },
    {
      key: "chick",
      name: "병아리",
      nickname: "삐약이",
      grade: "D",
      image: "./assets/pets/chick.png",
      summonText: "**어디선가 삐약소리가 들리며 알이 툭 갈라지고 삐약이가 나왔다.**",

      option: {
        type: "lottoSuccessChance",
        values: {
          1: 70,
          10: 80,
          20: 90,
          30: 100
        }
      }
    },
    {
      key: "snowman",
      name: "눈사람",
      nickname: "누니",
      grade: "D",
      image: "./assets/pets/snowman.png",
      summonText: "**차가운 김이 사르르 걷히고, 그 속에서 누니가 나타났다.**",

      option: {
        type: "farmCafeFailReduce",
        values: {
          1: 0.02,
          10: 0.04,
          20: 0.07,
          30: 0.10
        }
      }
    }
  ],

  C: [
    {
      key: "pig",
      name: "돼지",
      nickname: "꾸리",
      grade: "C",
      image: "./assets/pets/pig.png",
      summonText: "**꿀꿀거리는 소리와 함께 통통 튀기는 매력의 꾸리가 나타났다.**",

      option: {
        type: "exploreRepairChance",
        values: {
          1: 0.2,
          10: 0.25,
          20: 0.3,
          30: 0.35
        }
      }
    },
    {
      key: "rabbit",
      name: "토끼",
      nickname: "토토",
      grade: "C",
      image: "./assets/pets/rabbit.png",
      summonText: "**긴 귀가 쫑긋 올라오더니 이내 귀여운 토토가 모습을 드러냈다.**",

      option: {
        type: "cafeMoneyDouble",
        values: {
          1: 30,
          10: 40,
          20: 50,
          30: 60
        }
      }
    },
    {
      key: "penguin",
      name: "펭귄",
      nickname: "펭구",
      grade: "C",
      image: "./assets/pets/penguin.png",
      summonText: "**차가운 바람과함께 귀여운 날개를 파닥이는 펭구가 나타났다.**",

      option: {
        type: "topLootChance",
        values: {
          1: 5,
          15: 7,
          30: 10
        }
      }
    }
  ],

  B: [
    {
      key: "raccoon",
      name: "너구리",
      nickname: "너부리",
      grade: "B",
      image: "./assets/pets/raccoon.png",
      summonText: "**재빠르게 무언가 왔다갔다 하더니 장난기 많은 너부리가 나타났다.**",

      option: {
        type: "bankruptcyIgnoreFail",
        values: {
          1: 50,
          10: 65,
          20: 80,
          30: 100
        }
      }
    },
    {
      key: "wolf",
      name: "늑대",
      nickname: "울피",
      grade: "B",
      image: "./assets/pets/wolf.png",
      summonText: "**어두운 그림자 속에 푸른 눈빛이 번쩍였고 이내 울피가 모습을 드러냈다.**",

      option: {
        type: "upgradeDiscount",
        values: {
          1: 0.05,
          15: 0.07,
          30: 0.10
        }
      }
    },
    {
      key: "otter",
      name: "수달",
      nickname: "달이",
      grade: "B",
      image: "./assets/pets/otter.png",
      summonText: "**맑은 물방울들이 튀어오르더니 촉촉하게 젖어있는 귀여운 달이가 나타났다.**",

      option: {
        type: "cooldownReduce",
        values: {
          1: 0.2,
          10: 0.3,
          20: 0.4,
          30: 0.5
        }
      }
    }
  ],

  A: [
    {
      key: "bear",
      name: "곰",
      nickname: "꼬미",
      grade: "A",
      image: "./assets/pets/bear.png",
      summonText: "**부스럭거리는 소리가 나 들여다보니 꼬미와 눈이 마주쳤다. 우리 친구 맞지..?**",

      option: {
        type: "attackDurabilityReduce",
        values: {
          1: 3,
          10: 5,
          20: 7,
          30: 10
        }
      }
    },
    {
      key: "jerboa",
      name: "캥거루쥐",
      nickname: "지돌이",
      grade: "A",
      image: "./assets/pets/jerboa.png",
      summonText: "**민첩한 움직임이 멈춘 자리에서, 자신감넘치는 지돌이와 눈이마주쳤다.**"
    },
    {
      key: "fox",
      name: "여우",
      nickname: "폭시",
      grade: "A",
      image: "./assets/pets/fox.png",
      summonText: "**부드러운 바람이 스치더니 붉은 털을가진 폭시가 나타났다.**",

      option: {
        type: "engraveDestroyProtect",
        values: {
          1: 5,
          15: 7,
          30: 10
        }
      }
    }
  ],

  S: [
    {
      key: "white_tiger",
      name: "백호",
      nickname: "설이",
      grade: "S",
      image: "./assets/pets/white_tiger.png",
      summonText: "**순백의 털이 빛사이로 살짝 보이고 특별한 기운이 감싸고 있는 캡슐 안을 들여다보니 작은 아기설이가 눈을 떴다. 근데 왜 아기일까..?**"
    },
    {
      key: "phoenix",
      name: "피닉스",
      nickname: "플레어",
      grade: "S",
      image: "./assets/pets/phoenix.png",
      summonText: "**따뜻한 기운이 주변을 감싸고 이내 화려한 날개를 가진 아기플레어가 모습을 나타냈다. 근데 왜 아기일까..?**"
    },
    {
      key: "dinosaur",
      name: "공룡",
      nickname: "크앙이",
      grade: "S",
      image: "./assets/pets/dinosaur.png",
      summonText: "**오래된 기운을 품은 캡슐이 천천히 흔들리더니 아기크앙이 모습을 드러냈다. 근데 왜 아기지? 아기지만 무섭다..**"
    }
  ]
};

module.exports = petData;