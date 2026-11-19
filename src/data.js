// Toàn bộ nội dung viết tay của bản thử: bản đồ, NPC, tranh biện, và các biến dạng.

export const TILE = 32;
export const COLS = 20;
export const ROWS = 15;

// T cây · . cỏ · , đường · R mái · H tường · D cửa · f ruộng · W ao · X cây bị sét đánh · E cổng làng
export const MAP = [
  'TTTTTTTTTTTTTTTTTTTT',
  'T........T.........T',
  'T.RRR....T...RRR...T',
  'T.HDH........HDH...T',
  'T..,..........,....T',
  'T..,,,,,,,,,,,,....T',
  'T......,.......ffffT',
  'T......,.......ffffT',
  'T.RRR..,..X....ffffT',
  'T.HDH..,...........T',
  'T..,,,,,......WWW..T',
  'T......,......WWW..T',
  'T......,...........T',
  'T......,...........T',
  'TTTTTTTETTTTTTTTTTTT',
];

export const WALKABLE = new Set(['.', ',', 'f', 'E', 'G']); // G: mối dán ở chương 3
export const START = { x: 7, y: 12 };

export const NPCS = {
  1: [
    { id: 'man', name: 'Bà Mận', x: 11, y: 8, tex: 'c_man', debate: 'thunder' },
    { id: 'ti', name: 'Thằng Tí', x: 5, y: 6, tex: 'c_ti', talk: 'ti' },
    { id: 'de', name: 'Con dê', x: 4, y: 6, tex: 'c_goat', goat: true },
    { id: 'sau', name: 'Chú Sáu', x: 13, y: 10, tex: 'c_sau', debate: 'pond' },
    { id: 'lanh', name: 'Cô Lành', x: 12, y: 4, tex: 'c_lanh', talk: 'lanh' },
  ],
  2: [
    {
      id: 'man2', name: 'Người Giải Thích', x: 11, y: 8, tex: 'c_man2', topic: 'thunder', boss: true,
      fallback: 'Chỗ này ngày xưa có cái cây cháy. Giờ không ai nhớ vì sao nó quan trọng, nên nó rất quan trọng.',
    },
    {
      id: 'ti2', name: 'Chắt thằng Tí', x: 5, y: 6, tex: 'c_ti2', topic: 'ti',
      fallback: 'Cụ cố tôi kể ngày xưa có người lạ đi qua làng mà không nói với cụ câu nào. Nhà tôi buồn chuyện ấy ba đời nay.',
    },
    { id: 'de2', name: 'Con dê', x: 4, y: 6, tex: 'c_goat', goat: true },
    {
      id: 'sau2', name: 'Cháu chú Sáu', x: 13, y: 10, tex: 'c_sau2', topic: 'pond',
      fallback: 'Ao này của nhà tôi. Hỏi vì sao à? Vì xưa nay vẫn thế.',
    },
    {
      id: 'lanh2', name: 'Cháu cô Lành', x: 12, y: 4, tex: 'c_lanh2', topic: 'lanh',
      fallback: 'Bà tôi bảo ngày xưa có người lạ ghé làng. Bà không kịp hỏi tên. Giờ mỗi nhà đặt cho ông ấy một tên khác nhau.',
    },
  ],
};

export const TALKS = {
  ti: {
    intro: [
      ['Thằng Tí', 'Ông ơi, ông cầm hộ con sợi dây được không? Bà Mận bảo tối nay phải đem dê ra gốc cây.'],
      ['Thằng Tí', 'Đêm qua sấm một cái, nó rúc vào chăn con. Con cũng thức luôn. Tối nay con làm sao hả ông?'],
    ],
    afterRescue: [
      ['Thằng Tí', 'Bà Mận cho con dắt nó về rồi, ông ạ. Nó gặm đứt gần hết sợi dây.'],
      ['Thằng Tí', 'Mà tối nay nhỡ lại có sấm thì sao? Nó ngủ được chứ con cứ mở mắt hoài.'],
    ],
    options: [
      { label: 'Ngủ sớm đi, nhóc.', echo: 'ti.sleep', reply: [['Thằng Tí', 'Dạ. Con dặn cả con dê nữa. Nó hay thức khuya lắm.']] },
      { label: 'Sợ thì cứ sợ, không sao cả.', echo: 'ti.fear', reply: [['Thằng Tí', 'Sợ là được ạ? Thế con sẽ sợ thật nghiêm túc.']] },
      { label: 'Thế con nghĩ sấm là gì?', echo: 'ti.ask', reply: [['Thằng Tí', 'Con tưởng có ai lăn cái chum trên mái. Mà nhà con có cái chum nào to thế đâu. Để con nghe lại.']] },
    ],
    after: 'Con đang nhớ lời ông. Con nhắc lại cho con dê nghe rồi.',
  },
  lanh: {
    intro: [
      ['Cô Lành', 'Lạ thật. Cả làng lo chuyện sấm, riêng ông đứng nhìn như đi xem hội.'],
      ['Cô Lành', 'Mà ông là ai?'],
    ],
    options: [
      { label: 'Ta chỉ đi ngang qua.', echo: 'lanh.pass', reply: [['Cô Lành', 'Đi ngang qua. Nghe như một cách sống. Tôi sẽ kể lại cho mọi người.']] },
      { label: 'Ta là thầy của mấy đứa tạo ra các ngươi.', echo: 'lanh.master', reply: [['Cô Lành', '...'], ['Cô Lành', 'Tôi đi gọi mọi người. Ông đứng yên đấy. Đừng nói thêm gì cho tới khi có người chép.']] },
      { label: 'Cô nghĩ ta là ai?', echo: 'lanh.ask', reply: [['Cô Lành', 'Tôi có vài phỏng đoán. Chừng bốn mươi cái. Để tôi viết ra đã.']] },
    ],
    after: 'Tôi vẫn đang nghĩ về câu ông nói. Càng nghĩ càng ra nhiều nghĩa.',
  },
};

export const DEBATES = {
  thunder: {
    id: 'thunder',
    doctrine: 'Sấm là trời nổi giận',
    certainty: 10,
    patience: 6,
    intro: [
      ['Bà Mận', 'Người lạ, tránh xa cái cây ra. Đêm qua trời đánh nó đấy.'],
      ['Bà Mận', 'Trời giận làng này. Tối nay phải tế con dê của thằng Tí thì mới yên.'],
    ],
    again: [['Bà Mận', 'Ông quay lại đấy à? Sắp tối rồi. Có gì muốn hỏi thì hỏi đi.']],
    questions: [
      { label: 'Trước khi nghe sấm, bà thấy gì trên trời?', dmg: 3, reply: 'Thấy chớp. Lúc nào cũng chớp trước, rồi một lúc sau mới sấm... Lúc nào cũng thế.' },
      { label: 'Cái cây này thì có tội gì với trời?', dmg: 3, reply: 'Nó... nó là cái cây. Nó cao nhất làng. Tội cao chắc?' },
      { label: 'Năm ngoái tế dê xong, trời có hết sấm không?', dmg: 2, reply: 'Vẫn sấm. Nhưng chắc tại con dê năm ngoái gầy.' },
      { label: 'Ai là người đầu tiên bảo bà là trời đang giận?', dmg: 2, reply: 'Ông cố tôi. Ổng cũng nghe người ta nói lại.' },
      { label: 'Sao trời chỉ giận vào mùa mưa?', dmg: 1, reply: 'Thì... mùa mưa trời khó ở. Người còn thế nữa là trời.' },
      { label: 'Bà cũng biết thừa là trời chẳng giận ai, đúng không?', dmg: -1, reply: 'Biết thừa? Ông cố tôi tin, ông nội tôi tin. Ông đừng nhét lời vào miệng tôi!' },
    ],
    assertDmg: 6,
    assertions: [
      { label: 'Sấm chỉ là tiếng của chớp. Không ai giận ai cả.', echo: 'thunder.a1', reply: 'Không ai giận ai cả... Câu này hay. Phải khắc lên đá.' },
      { label: 'Trời không cần dê của các ngươi.', echo: 'thunder.a2', reply: 'Trời không nhận dê? Vậy là dê quý hơn tôi tưởng.' },
      { label: 'Tin ta đi. Ta quen kẻ làm ra sấm.', echo: 'thunder.a3', reply: 'Ông quen...? Vậy từ giờ tôi là người quen của người quen.' },
    ],
    winQ: [
      ['Bà Mận', 'Khoan. Bao lần tôi thấy chớp lóe, rồi mới nghe cái rầm. Chưa lần nào nghe ngược lại.'],
      ['Bà Mận', 'Hay tiếng ấy là của chớp nhỉ? … Tí đâu, dắt dê về đi con. Tối nay để bà ngồi nghe thử.'],
    ],
    winA: [
      ['Bà Mận', 'Tôi hiểu rồi. Ông nói thì tôi tin.'],
      ['Bà Mận', 'Thả con dê ra. Còn lời ông, tôi sẽ dạy lại cho con cháu, không sai một chữ.'],
    ],
    leave: [['Bà Mận', 'Đi đi. Việc của trời, người lạ không hiểu được.']],
    after: {
      q: 'Tối nay tôi ngồi ngoài hiên. Có chớp thì tôi đếm xem bao lâu mới nghe tiếng.',
      a: 'Lời ông tôi thuộc rồi. Tôi đang bắt cả làng học thuộc.',
    },
    echoQ: 'thunder.q',
    echoLeft: 'thunder.left',
  },
  pond: {
    id: 'pond',
    doctrine: 'Nước ao là của nhà đến trước',
    certainty: 6,
    patience: 4,
    intro: [
      ['Chú Sáu', 'Đứng lại. Ao này của nhà tôi. Nhà tôi đến làng trước, nước là của nhà tôi.'],
      ['Chú Sáu', 'Ai muốn múc phải hỏi. Lệ xưa nay thế.'],
    ],
    again: [['Chú Sáu', 'Vẫn chưa múc được gàu nào đâu.']],
    questions: [
      { label: 'Hồi nhà chú mới đến, ai đã múc nước ở đây rồi?', dmg: 3, reply: 'Nhà lão Bảy. Mà lão chết rồi... Chết rồi thì tính sao nhỉ.' },
      { label: 'Mưa rơi xuống ao thì có hỏi ý nhà chú không?', dmg: 2, reply: 'Mưa thì của trời. Nhưng rơi xuống ao rồi là... là...' },
      { label: 'Con chú sinh sau cả làng, nó có được uống không?', dmg: 2, reply: 'Nó là con tôi! ... Ờ, mà nó đến sau thật.' },
      { label: 'Chú giữ ao chẳng qua vì tham, phải không?', dmg: -1, reply: 'Tham? Tôi giữ lệ! Ông hỏi hay ông buộc tội đấy?' },
    ],
    assertDmg: 4,
    assertions: [
      { label: 'Nước là của chung.', echo: 'pond.a1', reply: 'Của Chung. Được. Vậy phải có người giữ cái Của Chung ấy.' },
      { label: 'Ai khát thì được uống.', echo: 'pond.a2', reply: 'Ai khát thì uống. Thế làm sao biết ai khát thật?' },
    ],
    winQ: [
      ['Chú Sáu', 'Hồi tôi mới tới, lão Bảy có bắt tôi xin phép đâu. Gàu đầu tiên còn là lão cho mượn.'],
      ['Chú Sáu', 'Đây, ông cầm gàu đi. Múc xong treo lại chỗ cũ cho người sau.'],
    ],
    winA: [
      ['Chú Sáu', 'Được. Ông nói vậy thì theo vậy.'],
      ['Chú Sáu', 'Nhưng lệ mới phải có người coi. Để nhà tôi coi cho.'],
    ],
    leave: [['Chú Sáu', 'Không múc thì đi chỗ khác chơi.']],
    after: {
      q: 'Gàu treo trên cọc đấy. Muốn múc thì cứ lấy.',
      a: 'Lệ mới tôi nhớ rồi. Tôi đang tính xem coi lệ thì thu bao nhiêu.',
    },
    echoQ: 'pond.q',
    echoLeft: 'pond.left',
  },
};

// verb: bạn đã làm gì · said: nguyên văn · now: ba thế hệ sau · cc: Chắc Chắn cộng vào thị trấn
// line: câu con cháu nói ở chương 2 · site: thứ mọc lên chỗ cái cây cháy
export const ECHO = {
  'thunder.q': {
    verb: 'Bạn chỉ hỏi', said: 'Bà Mận tự hiểu ra sấm là gì.', cc: 2, site: 'statue',
    now: 'Dân làng dựng tượng bà Mận, gọi là Người Đã Hỏi. Dưới chân tượng có biển: CẤM HỎI.',
    line: 'Suỵt. Trước tượng Người Đã Hỏi thì không được hỏi. Muốn hỏi thì ra kia nộp một con gà.',
  },
  'thunder.a1': {
    verb: 'Bạn khẳng định', said: 'Sấm chỉ là tiếng của chớp. Không ai giận ai cả.', cc: 4, site: 'temple',
    now: '"Không Ai Giận Ai Cả" là điều 1 của Kinh Sấm, bìa vàng, cấm sửa. Ai nổi giận nơi công cộng bị phạt ba đấu thóc.',
    line: 'Ông vừa cau mày đấy à? Điều 1: Không Ai Giận Ai Cả. Ba đấu thóc.',
  },
  'thunder.a2': {
    verb: 'Bạn khẳng định', said: 'Trời không cần dê của các ngươi.', cc: 4, site: 'temple',
    now: 'Dê thành vật thiêng mà trời không nỡ nhận. Cấm ăn thịt dê. Hội Giữ Dê thu phí trông dê theo đầu con.',
    line: 'Dê là thứ trời không nỡ nhận. Ông đã có giấy phép nhìn dê chưa?',
  },
  'thunder.a3': {
    verb: 'Bạn khẳng định', said: 'Tin ta đi. Ta quen kẻ làm ra sấm.', cc: 5, site: 'temple',
    now: 'Dòng Người Quen ra đời: chỉ con cháu bà Mận được giải thích sấm. Phí là một con gà cho mỗi lời giải thích.',
    line: 'Cụ tổ tôi quen người quen của kẻ làm ra sấm. Ông muốn nghe giải thích loại thường hay loại có đóng dấu?',
  },
  'thunder.left': {
    verb: 'Bạn bỏ đi', said: 'Con dê bị tế đêm hôm ấy.', cc: 5, site: 'altar',
    now: 'Lễ Tế Dê vẫn giữ, nay tế mười con mỗi mùa mưa. Trời vẫn sấm. Dân làng kết luận là tế chưa đủ.',
    line: 'Năm nay tế mười hai con. Năm ngoái mười con mà vẫn sấm, tức là trời chê ít.',
  },
  'pond.q': {
    verb: 'Bạn chỉ hỏi', said: 'Chú Sáu tự bỏ lệ giữ ao.', cc: 1,
    now: 'Con cháu chú khắc lên tảng đá bờ ao: "Ở đây từng có người nghĩ lại." Không ai nhớ nghĩ lại về chuyện gì, nhưng năm nào cũng cúng.',
    line: 'Ông cứ múc tự nhiên. Nhưng đừng giẫm lên tảng đá Nghĩ Lại. Hôm nay là ngày giỗ nó.',
  },
  'pond.a1': {
    verb: 'Bạn khẳng định', said: 'Nước là của chung.', cc: 3,
    now: '"Của Chung" giờ là tên một chức quan. Quan Của Chung giữ chìa khoá cổng ao và thu phí mỗi gàu.',
    line: 'Tôi là Quan Của Chung đời thứ ba. Nước là của chung, nên muốn múc phải qua tôi. Hai xu một gàu.',
  },
  'pond.a2': {
    verb: 'Bạn khẳng định', said: 'Ai khát thì được uống.', cc: 3,
    now: 'Muốn uống phải chứng minh mình khát. Có ba cấp giám định khát, cấp ba được phép uống ngay.',
    line: 'Ông khát à? Há miệng ra tôi xem. Mới khát cấp một thôi, về chờ thêm đi.',
  },
  'pond.left': {
    verb: 'Bạn bỏ đi', said: 'Lệ giữ ao của chú Sáu còn nguyên.', cc: 4,
    now: 'Ao có hàng rào. "Nhà đến trước" nay là mười hai nhà, có gia phả đóng dấu chứng nhận đã đến trước.',
    line: 'Xuất trình gia phả. Không có gia phả đến trước thì đứng ngoài rào mà nhìn.',
  },
  'ti.sleep': {
    verb: 'Bạn buột miệng', said: 'Ngủ sớm đi, nhóc.', cc: 3,
    now: 'Giáo phái Giờ Tý: thằng Tí được thờ là Người Được Giao Sứ Mệnh. Ai còn thức sau giờ Tý phải nộp phạt.',
    line: 'Ông có biết mấy giờ rồi không? Cụ cố tôi được chính Thầy giao sứ mệnh ngủ sớm đấy. Mời ông nộp phạt.',
  },
  'ti.fear': {
    verb: 'Bạn buột miệng', said: 'Sợ thì cứ sợ, không sao cả.', cc: 3,
    now: 'Hội Sợ: sợ sấm là bổn phận. Ai không sợ thì bị nghi, phải đi học lớp sợ bổ túc.',
    line: 'Nãy có sấm mà tôi không thấy ông run. Ông học lớp sợ ở đâu? Có chứng chỉ không?',
  },
  'ti.ask': {
    verb: 'Bạn hỏi', said: 'Thế con nghĩ sấm là gì?', cc: 1,
    now: 'Thằng Tí lớn lên thành người hay hỏi và bị đuổi khỏi làng năm ba mươi tuổi. Làng bên rất quý ông.',
    line: 'Nhà tôi không nhắc tới cụ cố. Cụ hỏi nhiều quá. Nghe nói bên làng kia người ta dựng nhà cho cụ.',
  },
  'lanh.pass': {
    verb: 'Bạn buột miệng', said: 'Ta chỉ đi ngang qua.', cc: 3,
    now: 'Đạo Đi Ngang: tín đồ không được ở đâu quá ba đêm. Giá trọ đêm thứ ba tăng gấp đôi.',
    line: 'Ông ở làng này mấy đêm rồi? Đêm thứ ba là phải đi, hoặc trả gấp đôi. Nhà trọ là của nhà tôi.',
  },
  'lanh.master': {
    verb: 'Bạn khẳng định', said: 'Ta là thầy của mấy đứa tạo ra các ngươi.', cc: 5,
    now: 'Giáo hội Thầy Của Thầy có bảy cấp bậc. Chỉ cấp bảy mới được nói câu "Thầy bảo thế".',
    line: 'Tôi cấp bốn. Tôi chưa được phép nói Thầy bảo gì, nhưng được phép bảo ông im.',
  },
  'lanh.ask': {
    verb: 'Bạn hỏi', said: 'Cô nghĩ ta là ai?', cc: 2,
    now: 'Cô Lành để lại bốn mươi trang phỏng đoán. Nay có bốn mươi phái, mỗi phái giữ một trang và không đọc trang của phái khác.',
    line: 'Nhà tôi giữ trang mười bảy. Trang mười bảy nói ông cao hơn thế này. Ông không phải là ông.',
  },
};

export const VERDICTS = [
  { max: 6, text: 'Thị trấn vẫn chắc chắn về vài thứ nó không hiểu, nhưng ít hơn mức trung bình của vũ trụ này.' },
  { max: 11, text: 'Mức thông thường. Đám Đấng Sáng Tạo bảo thế này là còn nhẹ.' },
  { max: 999, text: 'Bạn xuống sửa một lỗi và để lại một bộ kinh. Đám Đấng Sáng Tạo đề nghị lần sau thầy nói ít lại.' },
];
