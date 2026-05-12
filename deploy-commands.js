require("dotenv").config();
const { REST, Routes, SlashCommandBuilder } = require("discord.js");

const rest = new REST({ version: "10" }).setToken(process.env.TOKEN);
const CLIENT_ID = "1487641534462689391";

const commands = [
new SlashCommandBuilder()
  .setName("윷온")
  .setDescription("관리자 전용: 윷놀이 활성화"),

new SlashCommandBuilder()
  .setName("윷오프")
  .setDescription("관리자 전용: 윷놀이 비활성화"),

  new SlashCommandBuilder()
    .setName("가입")
    .setDescription("게임에 가입합니다.")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("탈퇴")
    .setDescription("게임에서 탈퇴합니다.")
    .toJSON(),

     new SlashCommandBuilder()
    .setName("강화")
    .setDescription("무기를 강화합니다.")
    .toJSON(),

    new SlashCommandBuilder()
    .setName("별의각인")
    .setDescription("별의각인을 시도합니다.")
    .toJSON(),

    new SlashCommandBuilder()
  .setName("가방")
  .setDescription("보유한 아이템을 확인합니다.")
  .toJSON(),

  new SlashCommandBuilder()
  .setName("정보")
  .setDescription("내 정보를 확인합니다.")
  .toJSON(),

  new SlashCommandBuilder()
  .setName("통장잔고")
  .setDescription("현재 내 잔액을 확인합니다.")
  .toJSON(),

  new SlashCommandBuilder()
  .setName("훔쳐보기")
  .setDescription("다른 유저의 정보를 확인합니다.")
  .addUserOption(option =>
    option
      .setName("유저")
      .setDescription("확인할 유저")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("송금")
  .setDescription("다른 유저에게 돈을 보냅니다.")
  .addUserOption(option =>
    option.setName("유저")
      .setDescription("송금할 대상")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option.setName("금액")
      .setDescription("송금할 금액")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("윷대결")
  .setDescription("다른 유저와 1:1 윷놀이 대결을 시작합니다.")
  .addUserOption(option =>
    option
      .setName("상대")
      .setDescription("대결할 유저를 선택하세요.")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("농사")
  .setDescription("작물을 수확해 부자가 되어보자밍!(하루 30회)"),

  new SlashCommandBuilder()
  .setName("카페")
  .setDescription("카페에서 돈을 벌어보자밍!(하루 50회)"),

  new SlashCommandBuilder()
  .setName("탐험")
  .setDescription("탐험을 통해 수리석과 희귀조각을 획득해보세요."),

  new SlashCommandBuilder()
  .setName("작물개수")
  .setDescription("보유 중인 작물 개수를 확인합니다."),

  new SlashCommandBuilder()
  .setName("작물시세")
  .setDescription("작물시세를 확인해보세요."),

  new SlashCommandBuilder()
  .setName("공격")
  .setDescription("현재 보유한 무기로 보스를 공격합니다.(하루 1회)"),

  new SlashCommandBuilder()
  .setName("경험치")
  .setDescription("경험치를 받을 수 있습니다."),

  new SlashCommandBuilder()
  .setName("상점")
  .setDescription("상품을 구매할 수 있습니다."),

  new SlashCommandBuilder()
  .setName("펫상점")
  .setDescription("펫 관련된 상품을 구매할 수 있습니다."),

  new SlashCommandBuilder()
  .setName("펫정보")
  .setDescription("현재 보유 중인 펫 정보를 확인합니다."),

  new SlashCommandBuilder()
  .setName("전리품")
  .setDescription("전리품을 획득합니다.(쿨타임 3시간)"),

  new SlashCommandBuilder()
  .setName("복권")
  .setDescription("복권은 쿨타임1시간입니다."),

  new SlashCommandBuilder()
  .setName("출석체크")
  .setDescription("출석체크는 하루에 1회 가능합니다."),

  new SlashCommandBuilder()
  .setName("작물판매")
  .setDescription("보유 중인 작물을 판매합니다.")
  .addStringOption(option =>
    option
      .setName("작물")
      .setDescription("판매할 작물을 선택하세요.")
      .setRequired(true)
      .addChoices(
        { name: "복숭아", value: "peach" },
        { name: "딸기", value: "strawberry" },
        { name: "샤인머스켓", value: "shineMuscat" },
        { name: "사과", value: "apple" },
        { name: "산삼", value: "wildGinseng" }
      )
  )
  .addIntegerOption(option =>
    option
      .setName("개수")
      .setDescription("판매할 개수를 입력하세요.")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("작물구매")
  .setDescription("현재 시세로 작물을 구매합니다.")
  .addStringOption(option =>
    option
      .setName("작물")
      .setDescription("구매할 작물을 선택하세요.")
      .setRequired(true)
      .addChoices(
        { name: "복숭아", value: "peach" },
        { name: "딸기", value: "strawberry" },
        { name: "샤인머스켓", value: "shineMuscat" },
        { name: "사과", value: "apple" },
        { name: "산삼", value: "wildGinseng" } // 선택은 가능 (코드에서 차단)
      )
  )
  .addIntegerOption(option =>
    option
      .setName("개수")
      .setDescription("구매할 개수를 입력하세요.")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("배그")
  .setDescription("배팅 금액으로 경쟁전을 진행합니다.")
  .addIntegerOption(option =>
    option
      .setName("금액")
      .setDescription("배팅할 금액을 입력하세요.")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("낚시")
  .setDescription("돈을 걸고 낚시를 합니다.")
  .addIntegerOption(option =>
    option
      .setName("금액")
      .setDescription("배팅할 금액")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("로또")
  .setDescription("배팅 금액으로 로또에 도전한다밍!")
  .addIntegerOption(option =>
    option
      .setName("금액")
      .setDescription("5,000원부터 배팅 가능합니다.")
      .setRequired(true)
      .setMinValue(5000)
  ),

  new SlashCommandBuilder()
  .setName("가위바위보")
  .setDescription("미닝봇과 짱깸뽀를 합니다.")
  .addIntegerOption(option =>
    option
      .setName("배팅액")
      .setDescription("배팅할 금액")
      .setRequired(true)
      .setMinValue(1000)
  ),

new SlashCommandBuilder()
  .setName("순위")
  .setDescription("순위를 확인합니다.")
  .addSubcommand(subcommand =>
    subcommand
      .setName("돈")
      .setDescription("돈 순위를 확인합니다.")
  ),

  new SlashCommandBuilder()
  .setName("파산신청")
  .setDescription("파산신청은 1시간 마다 가능합니다."),

  new SlashCommandBuilder()
  .setName("쿠폰사용")
  .setDescription("쿠폰 코드를 입력해 보상을 받습니다."),

  new SlashCommandBuilder()
  .setName("윷판테스트")
  .setDescription("윷판 이미지 테스트용 명령어"),

 new SlashCommandBuilder()
    .setName("무기지급")
    .setDescription("관리자가 유저에게 무기를 지급합니다.")
    .addUserOption(option =>
      option.setName("유저")
        .setDescription("대상 유저")
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName("레벨")
        .setDescription("지급할 무기 강화 수치")
        .setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName("무기초기화")
    .setDescription("관리자가 유저의 무기를 1강으로 초기화합니다.")
    .addUserOption(option =>
      option.setName("유저")
        .setDescription("대상 유저")
        .setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName("돈지급")
    .setDescription("관리자가 유저에게 돈을 지급합니다.")
    .addUserOption(option =>
      option.setName("유저")
        .setDescription("대상 유저")
        .setRequired(true))
    .addIntegerOption(option =>
      option.setName("금액")
        .setDescription("지급할 금액")
        .setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName("돈초기화")
    .setDescription("관리자가 유저의 돈을 초기화합니다.")
    .addUserOption(option =>
      option.setName("유저")
        .setDescription("대상 유저")
        .setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
    .setName("정보초기화")
    .setDescription("관리자가 유저 정보를 전체 초기화합니다.")
    .addUserOption(option =>
      option.setName("유저")
        .setDescription("대상 유저")
        .setRequired(true))
    .toJSON(),

  new SlashCommandBuilder()
  .setName("각인설정")
  .setDescription("유저의 각인 레벨을 설정합니다.")
  .addUserOption(option =>
    option
      .setName("유저")
      .setDescription("대상 유저")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName("레벨")
      .setDescription("각인 레벨")
      .setRequired(true)
      .setMinValue(0)
      .setMaxValue(30)
  ),

  new SlashCommandBuilder()
  .setName("쿠폰생성")
  .setDescription("관리자 전용 쿠폰 생성")
  .addStringOption(option =>
    option
      .setName("코드")
      .setDescription("쿠폰 코드")
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("종류")
      .setDescription("보상 종류")
      .setRequired(true)
      .addChoices(
        { name: "돈", value: "money" },
        { name: "아이템", value: "item" },
        { name: "작물", value: "crop" }
      )
  )
  .addStringOption(option =>
    option
      .setName("항목")
      .setDescription("아이템 또는 작물 선택 (돈은 아무거나 입력)")
      .setRequired(true)
      .addChoices(
        // 아이템
        { name: "수리석", value: "repairStone" },
        { name: "각인석", value: "engraveStone" },
        { name: "물음표박스", value: "questionBox" },
        { name: "송금 더블 쿠폰", value: "depositDoubleCoupon" },
        { name: "송금 랜덤 쿠폰", value: "randomTransferCoupon" },
        { name: "산삼조각", value: "wildGinsengPiece" },

        // 작물
        { name: "복숭아", value: "peach" },
        { name: "딸기", value: "strawberry" },
        { name: "샤인머스켓", value: "shineMuscat" },
        { name: "사과", value: "apple" },
        { name: "산삼", value: "wildGinseng" }
      )
  )
  .addIntegerOption(option =>
    option
      .setName("수량")
      .setDescription("지급할 수량")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName("개수")
      .setDescription("쿠폰 총 사용 가능 횟수")
      .setRequired(true)
  )
  .addIntegerOption(option =>
    option
      .setName("유효기간")
      .setDescription("유효기간 (일 단위)")
      .setRequired(true)
  ),

   new SlashCommandBuilder()
  .setName("아이템지급")
  .setDescription("관리자 전용 아이템 지급")
  .addUserOption(option =>
    option
      .setName("유저")
      .setDescription("아이템을 지급할 유저")
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("아이템")
      .setDescription("지급할 아이템")
      .setRequired(true)
      .addChoices(
        { name: "수리석", value: "repairStone" },
        { name: "각인석", value: "engraveStone" },
        { name: "물음표박스", value: "questionBox" },
        { name: "송금 더블 쿠폰", value: "depositDoubleCoupon" },
        { name: "송금 랜덤 쿠폰", value: "randomTransferCoupon" },
        { name: "산삼조각", value: "wildGinsengPiece" },
      )
  )
  .addIntegerOption(option =>
    option
      .setName("수량")
      .setDescription("지급할 수량")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("경험치지급")
  .setDescription("관리자 전용 경험치 지급")
  .addUserOption(option =>
    option
      .setName("유저")
      .setDescription("경험치를 지급할 유저")
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("종류")
      .setDescription("지급할 경험치 종류")
      .setRequired(true)
      .addChoices(
        { name: "농사 경험치", value: "farm" },
        { name: "카페 경험치", value: "gather" }
      )
  )
  .addIntegerOption(option =>
    option
      .setName("수량")
      .setDescription("지급할 경험치 수량")
      .setRequired(true)
  ),

  new SlashCommandBuilder()
  .setName("경험치초기화")
  .setDescription("관리자 전용 경험치 초기화")
  .addUserOption(option =>
    option
      .setName("유저")
      .setDescription("경험치를 초기화할 유저")
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName("종류")
      .setDescription("초기화할 경험치 종류")
      .setRequired(true)
      .addChoices(
        { name: "농사 경험치", value: "farm" },
        { name: "카페 경험치", value: "gather" }
      )
  ),

  new SlashCommandBuilder()
  .setName("가방확인")
  .setDescription("관리자 전용 유저 가방 확인")
  .addUserOption(option =>
    option
      .setName("유저")
      .setDescription("가방을 확인할 유저")
      .setRequired(true)
  )

];

(async () => {
  try {
    console.log("슬래시 명령어 등록 중...");
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("슬래시 명령어 등록 완료");
  } catch (error) {
    console.error(error);
  }
})();