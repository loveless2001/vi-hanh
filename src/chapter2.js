// Chương 2: Bìa Vàng.
// Mỗi lời bạn để lại ở chương 1 (trừ những lần bạn chỉ hỏi) nay là một giáo điều phải đối mặt.
// Khoá của CH2 là id của ECHO chương 1. Câu mở đầu của mỗi cuộc là ECHO[id].line.

import { ECHO } from './data.js';

export const CH2 = {
  'ti.sleep': {
    doctrine: 'Thức sau giờ Tý là có tội', certainty: 6, patience: 4,
    intro2: 'Phạt thức khuya là ba xu. Cãi lại là sáu xu.',
    questions: [
      { label: 'Cụ cố anh hồi ấy mấy tuổi?', dmg: 3, reply: 'Bảy tuổi... Ý ông là sứ mệnh được giao cho một đứa bé bảy tuổi đang sợ sấm à?' },
      { label: 'Người thu tiền phạt thì thức tới giờ nào?', dmg: 2, reply: 'Tôi phải thức để bắt người thức. Việc công mà... Ờ.' },
      {
        label: 'Ngủ sớm để làm gì, kinh có ghi không?', dmg: 2,
        readTablet: (text) => `Trên thẻ chỉ có “${text}”. ` + (
          text.toLowerCase().split(' ').includes('nhóc')
            ? 'Ông hỏi chữ “nhóc” ấy à? Các cụ bảo là ẩn dụ. Tôi vẫn thấy giống tiếng gọi trẻ con.'
            : 'Chỗ nào ghi tiền phạt ấy nhỉ? À, tiền phạt ở sổ khác.'
        ),
      },
      { label: 'Anh cũng thấy phạt người thức khuya là vô lý chứ?', dmg: -1, reply: 'Vô lý là cãi lời Thầy. Sáu xu. Hỏi kiểu gài người ta như thế là chín xu.' },
    ],
    own: 'Ông là Thầy? Vậy mời Thầy xác nhận: giờ Tý tính theo gà gáy hay theo trống canh? Làng cãi nhau chuyện ấy hai đời rồi.',
    retract: 'Thầy rút lại... Vậy từ nay phải thức khuya? Phạt ngủ sớm bao nhiêu thì vừa ạ?',
    winQ: ['Một đứa bé bảy tuổi sợ sấm, một ông khách bảo nó đi ngủ. Chỉ có thế.', 'Tôi thôi thu phạt. Tôi cũng buồn ngủ lắm rồi.'],
    winA: ['Thầy dạy sao con ghi vậy. Con ghi ngay đây, không sót chữ nào.'],
    leave: 'Về ngủ đi. Còn kịp trước giờ Tý.',
    afterQ: 'Giờ tôi ngủ lúc nào buồn ngủ. Hoá ra cũng được.',
    afterA: 'Con đang chép lời Thầy mới dạy. Bản này bìa dày hơn.',
  },
  'ti.fear': {
    doctrine: 'Sợ sấm là bổn phận', certainty: 6, patience: 4,
    intro2: 'Lớp sợ bổ túc khai giảng tối nay. Học phí một đấu thóc.',
    questions: [
      { label: 'Hôm nào trời không sấm thì các anh sợ cái gì?', dmg: 3, reply: 'Thì... sợ dự phòng. Thú thật hôm ấy cả làng ngồi nhìn nhau.' },
      { label: 'Người dạy lớp sợ có sợ không?', dmg: 2, reply: 'Thầy giáo phải bình tĩnh mới dạy được chứ. Ơ. Vậy là ổng...' },
      {
        label: 'Trên thẻ khắc gì mà anh phải mở lớp dạy sợ?', dmg: 2,
        readTablet: (text) => `Đây, ông tự đọc đi. “${text}”. Còn cái lớp… làng mình mở về sau.`,
      },
      { label: 'Chính anh cũng đâu có sợ thật, phải không?', dmg: -1, reply: 'Tôi sợ rất thật! Tôi có chứng chỉ! Đã không sợ lại còn nghi người sợ. Ghi tên.' },
    ],
    own: 'Thầy hiện về! Mọi người ơi, sợ đi! Sợ ngay! Thầy đang nhìn đấy!',
    retract: 'Thầy đổi ý… tức là giờ cấm sợ? Con sợ quá. Chết, con xin lỗi.',
    winQ: ['Hồi ấy cụ tôi mới bảy tuổi. Hay ông khách chỉ muốn dỗ cụ nín?', 'Tôi giải tán lớp. Ai sợ thì sợ, ai không thì thôi.'],
    winA: ['Con sẽ dạy lại đúng như Thầy vừa nói. Lớp tối nay đổi giáo trình.'],
    leave: 'Ông đi mà không run. Tôi ghi tên ông rồi đấy.',
    afterQ: 'Sấm thì tôi vẫn giật mình. Nhưng giờ không phải nộp bài nữa.',
    afterA: 'Giáo trình mới đang soạn. Có cả phần phụ lục về Thầy.',
  },
  'pond.a1': {
    doctrine: 'Nước là Của Chung, phải qua Quan Của Chung', certainty: 6, patience: 4,
    intro2: 'Múc trộm phạt gấp mười.',
    questions: [
      { label: 'Của chung mà sao chìa khoá chỉ có một cái?', dmg: 3, reply: 'Chung thì phải có người giữ. Người giữ thì phải có khoá. Khoá thì... của tôi.' },
      { label: 'Hai xu ấy rồi chia chung cho ai?', dmg: 3, reply: 'Chia vào quỹ Của Chung. Quỹ do tôi giữ. Giữ hộ mọi người.' },
      { label: 'Trước khi có quan, người ta múc nước thế nào?', dmg: 1, reply: 'Múc bừa. Loạn lắm. Nghe kể thế.' },
      { label: 'Ông giữ khoá là để bỏ túi riêng, đúng chứ?', dmg: -1, reply: 'Vu khống quan chức. Phạt bốn xu, nộp cho tôi.' },
    ],
    own: 'Thầy đấy ư? May quá. Xin Thầy ký vào đây: "Của Chung giao cho nhà Sáu giữ đời đời."',
    retract: 'Rút lại "của chung"? Vậy nước là của riêng. Riêng thì cũng phải có người giữ sổ. Để tôi.',
    winQ: ['Một cái khoá, một cái quỹ, một cái nhà. Đều của tôi. Mà tên lại là Của Chung.', 'Thôi. Tôi tháo khoá. Ông đừng nhìn tôi nữa.'],
    winA: ['Thầy phán vậy thì chức quan đổi tên. Việc thì vẫn tôi làm.'],
    leave: 'Không có hai xu thì khát ráng chịu.',
    afterQ: 'Cổng mở rồi. Tôi đang tập làm người múc nước bình thường.',
    afterA: 'Chức mới của tôi dài hơn chức cũ. Thầy ban mà.',
  },
  'pond.a2': {
    doctrine: 'Muốn uống phải chứng minh mình khát', certainty: 6, patience: 4,
    intro2: 'Giám định khát cấp hai mất ba ngày. Nhớ mang theo nước mà uống trong lúc chờ.',
    questions: [
      { label: 'Ai giám định cơn khát của người giám định?', dmg: 3, reply: 'Tôi tự giám định. Lần nào tôi cũng đạt cấp ba. Trùng hợp thôi.' },
      { label: 'Đã có ai chờ giám định mà xỉu chưa?', dmg: 2, reply: 'Có. Xỉu thì được công nhận khát cấp ba ngay. Quy trình rất nhân đạo.' },
      { label: 'Trẻ con chưa biết nói thì khai khát kiểu gì?', dmg: 2, reply: 'Khóc. Nhưng còn phải giám định xem khóc vì khát hay vì chuyện khác...' },
      { label: 'Ông thừa biết luật này vô nghĩa mà, đúng không?', dmg: -1, reply: 'Luật do Thầy ban. Ông chê Thầy à? Trừ một cấp khát.' },
    ],
    own: 'Thầy! Xin Thầy định nghĩa giúp chữ "khát". Hội đồng cãi nhau bốn mươi năm chưa xong.',
    retract: 'Rút lại? Vậy ai không khát cũng được uống ư? Thế thì phải giám định xem ai không khát.',
    winQ: ['Người xỉu thì được uống. Người chưa xỉu thì phải chờ tới khi xỉu.', 'Tôi giải tán hội đồng. Ai khát cứ uống, tự biết lấy.'],
    winA: ['Hội đồng sẽ họp để chép lời Thầy. Dự kiến họp ba ngày.'],
    leave: 'Ông chưa đủ khát đâu. Tôi nhìn là biết.',
    afterQ: 'Tôi vừa uống một gàu mà không ai giám định. Lạ miệng thật.',
    afterA: 'Định nghĩa mới của Thầy đang được giám định.',
  },
  'pond.left': {
    doctrine: 'Ao là của mười hai nhà đến trước', certainty: 7, patience: 4,
    intro2: 'Gia phả phải có dấu đỏ. Dấu đen là gia phả đến sau.',
    ownLabel: 'Ta là Thầy. Hôm ấy ta đã đứng ở đây.',
    retractLabel: 'Lẽ ra hôm ấy ta không nên bỏ đi.',
    ownLegacy: 'Gia phả có thêm tên Thầy. Cả mười hai nhà đều xin nhận Thầy về nhánh mình.',
    retractLegacy: 'Câu “Lẽ ra hôm ấy ta không nên bỏ đi” được in riêng một quyển. Sách bán ngay cổng rào.',
    questions: [
      { label: 'Mười hai nhà cùng đến trước thì nhà nào đến trước nhất?', dmg: 3, reply: 'Nhà tôi. Mười một nhà kia cũng nói vậy. Kiện nhau từ đời ông tôi.' },
      { label: 'Ai đóng dấu vào gia phả?', dmg: 3, reply: 'Nhà tôi đóng. Phí đóng dấu thì... thôi, ông hỏi làm gì.' },
      { label: 'Con cá trong ao thì đến trước hay đến sau?', dmg: 2, reply: 'Cá... cá ở đấy từ trước cả lão Bảy. Ông đừng nói với ai.' },
      { label: 'Nhà ông dựng rào chẳng qua để thu tiền, phải không?', dmg: -1, reply: 'Xúc phạm nhà đến trước. Lùi ra sau rào thêm ba bước.' },
    ],
    own: 'Gia phả nhà tôi không ghi Thầy nào. Mà nếu thật, mời Thầy xác nhận nhà tôi đến trước nhất.',
    retract: 'Giờ ông mới nói. Cụ tôi kể có người lạ đến, nghe xong rồi bỏ đi. Để tôi chép: "Thầy hối hận." Câu này đáng một chương riêng.',
    winQ: ['Cá đến trước. Mưa đến trước cá. Mười hai nhà cãi nhau xem ai đến trước một cái ao có sẵn.', 'Tôi dỡ rào. Mười một nhà kia để tôi nói chuyện.'],
    winA: ['Để tôi lấy mực đỏ ghi lời ông vào gia phả. Mười một nhà kia chỉ được dùng mực đen.'],
    leave: 'Lại bỏ đi. Cụ tôi kể đúng thật.',
    afterQ: 'Rào dỡ được nửa rồi. Mười một nhà kia đang hỏi tôi bị làm sao.',
    afterA: 'Gia phả có tên Thầy rồi. Dấu đỏ.',
  },
  'lanh.pass': {
    doctrine: 'Không ai được ở đâu quá ba đêm', certainty: 6, patience: 4,
    intro2: 'Đạo Đi Ngang dạy thế. Thầy chỉ đi ngang qua, nên ai ở lại là trái ý Thầy.',
    questions: [
      { label: 'Nhà chị ở làng này mấy đời rồi?', dmg: 3, reply: 'Ba đời... Nhà tôi được miễn. Phải có người ở lại để nhắc người khác đi chứ.' },
      { label: 'Tiền trọ đêm thứ ba vào túi ai?', dmg: 2, reply: 'Vào quỹ Đi Ngang. Quỹ thì không đi đâu cả. Nó nằm ở nhà tôi.' },
      { label: 'Thầy đi ngang qua rồi đi đâu, kinh có ghi không?', dmg: 2, reply: 'Không ghi. Có lẽ Thầy chỉ đang... đi. Không có ý dạy gì.' },
      { label: 'Chị bày ra đạo này để thu tiền trọ, đúng không?', dmg: -1, reply: 'Báng bổ. Ông hết đêm rồi, mời đi cho.' },
    ],
    own: 'Thầy quay lại ư? Kinh ghi Thầy chỉ đi ngang qua, không quay lại. Quay lại thì không phải Thầy, hoặc kinh phải sửa. Mà kinh cấm sửa.',
    retract: 'Rút lại "đi ngang qua"? Vậy là Thầy ở lại? Ở lại quá ba đêm thì tính sao đây?',
    winQ: ['Một người khách bảo mình đi ngang qua. Bà tôi nghe ra thành một cách sống.', 'Ai muốn ở thì ở. Nhà trọ tôi tính giá thường.'],
    winA: ['Vâng, Thầy nói sao thì đạo sửa vậy. À không, cấm sửa. Thì viết đạo mới.'],
    leave: 'Đi ngang qua. Đúng như kinh dạy. Quý hoá quá.',
    afterQ: 'Có ông khách ở tới đêm thứ năm rồi. Trời chưa sập.',
    afterA: 'Đạo mới chưa có tên. Tôi đang nghĩ một cái tên có chữ Thầy.',
  },
  'lanh.master': {
    doctrine: 'Chỉ cấp bảy được nói "Thầy bảo thế"', certainty: 7, patience: 4,
    intro2: 'Muốn lên cấp phải đóng góp. Cấp năm là mười đấu thóc.',
    questions: [
      { label: 'Cấp bảy đã ai gặp Thầy chưa?', dmg: 3, reply: 'Chưa. Nhưng cấp bảy được phép nói là đã gặp.' },
      { label: 'Thầy xếp bảy cấp ấy lúc nào?', dmg: 3, reply: 'Thầy chỉ nói một câu rồi đi. Bảy cấp là các cụ... suy ra.' },
      { label: 'Lên cấp bằng thóc thì Thầy ăn thóc à?', dmg: 2, reply: 'Thầy không ăn. Cấp bảy ăn hộ.' },
      { label: 'Chị cũng thấy bảy cấp ấy là trò bịp chứ?', dmg: -1, reply: 'Hỗn với cấp trên. Tôi được phép bảo ông im, và tôi đang dùng phép ấy.' },
    ],
    own: 'Ông là Thầy? Người tự nhận là Thầy phải lên cấp bảy thẩm định. Lệ phí thẩm định hai mươi đấu thóc.',
    retract: 'Thầy rút lại câu "ta là thầy"? Vậy Thầy không phải Thầy. Nhưng thế thì lời rút lại này của ai?',
    winQ: ['Bảy cấp, không cấp nào gặp Thầy. Thóc thì có người ăn hộ.', 'Tôi trả lại cái thẻ cấp bốn. Nói thật, tôi chưa bao giờ thích bảo ai im.'],
    winA: ['Hồ sơ của ông tôi chuyển lên cấp bảy. Trong lúc chờ, ông được tạm coi là cấp một.'],
    leave: 'Im là đúng. Ông học nhanh đấy.',
    afterQ: 'Tôi hết cấp rồi. Giờ ai nói gì tôi cũng phải tự nghĩ xem đúng không. Mệt ghê.',
    afterA: 'Cấp bảy chưa trả lời. Họ đang họp xem Thầy có được phép là Thầy không.',
  },
};

// Con cháu của những người bạn chỉ hỏi ở chương 1: không phải kẻ địch, và chịu đứng cạnh bạn trước trùm.
export const ALLY = {
  'ti.ask': 'Mà ông hỏi nghe giống cụ ghê. Tôi... cũng hay muốn hỏi. Ông có ra chỗ lão Giải Thích thì tôi đứng cạnh.',
  'pond.q': 'Nhà tôi không ưa lão Giải Thích. Ông mà ra hỏi lão, tôi ra đứng nghe.',
  'lanh.ask': 'Nhưng trang mười bảy cũng ghi người ấy thích hỏi lại. Ông ra hỏi lão Giải Thích đi, tôi theo xem.',
};

export const BOSS = {
  doctrine: 'Chỉ ta được giải thích ý Thầy',
  intro2: 'Mọi lời của Thầy ở làng này đều qua tay tôi. Ông muốn hiểu câu nào, tôi báo giá câu ấy.',
  again: 'Lại ông. Có gà chưa?',
  questions: [
    { label: 'Thầy thuê ông từ bao giờ?', dmg: 2, reply: 'Thuê thì phải có giấy. Giấy thì… cụ tôi có để lại cái bàn này.' },
    { label: 'Nếu Thầy đứng ngay đây, ông có nhận ra không?', dmg: 2, reply: 'Tất nhiên. Thầy cao lớn, có hào quang, và không hỏi nhiều như ông.' },
    { label: 'Lời giải thích có đóng dấu khác loại thường chỗ nào?', dmg: 1, reply: 'Khác ở con dấu. Và ba con gà.' },
    { label: 'Ông biết thừa mình đang lừa cả làng, đúng không?', dmg: -1, reply: 'Báng bổ! Bà con nghe thấy chưa? Phạt hai con gà.' },
  ],
  witness: {
    ti: { label: 'Nhà thằng Tí bảo họ tự nghĩ được. Vậy họ còn cần ông làm gì?', dmg: 3, reply: 'Tự nghĩ thì... dễ nghĩ sai. Phải không? Này, sao cậu kia lại gật đầu với ông ta?' },
    pond: { label: 'Bờ ao giờ ai cũng múc được, chưa thấy ai cần giải thích. Sao thế?', dmg: 3, reply: 'Nước thì khác. Nước không cần hiểu. Còn lời Thầy thì... thì cũng chỉ là lời.' },
    lanh: { label: 'Nhà cô Lành bảo ông chưa gặp Thầy bao giờ. Ông gặp chưa?', dmg: 3, reply: 'Tôi gặp trong... trong sách. Sách do ông tôi viết. Ông tôi cũng chưa gặp.' },
  },
  assertion: {
    label: 'Ta chính là Thầy. Dẹp bàn đi.', echo: 'boss.own', dmg: -2,
    reply: 'Kẻ mạo danh thứ mười bảy của năm nay. Thầy thật thì cao lớn, có hào quang, và đã nộp phí xác minh.',
  },
  winQ: [
    'Thầy không thuê tôi. Dân làng thì tự hỏi được. Vậy tôi ngồi đây làm gì?',
    'Tôi dẹp bàn. Kinh để đấy, ai đọc thì đọc. Gà tôi trả lại, trừ mấy con đã ăn.',
  ],
  leave: 'Lần sau quay lại nhớ mang gà.',
  afterQ: 'Tôi đang học đóng bàn. Cái đầu tiên hơi cập kênh. Ông ngồi thử hộ tôi nhé?',
};

Object.assign(ECHO, {
  'boss.q': {
    verb: 'Bạn chỉ hỏi', said: 'Người Giải Thích tự dẹp bàn.', cc: 0,
    now: 'Dân làng tự đọc lấy. Mỗi người hiểu một kiểu và cãi nhau rất to. Không ai thu phí cãi.',
  },
  'boss.own': {
    verb: 'Bạn khẳng định', said: 'Ta chính là Thầy. Dẹp bàn đi.', cc: 2,
    now: 'Sổ ghi: "Kẻ mạo danh thứ mười bảy." Hằng năm làng có lễ kỷ niệm ngày đuổi được kẻ mạo danh.',
  },
  'boss.left': {
    verb: 'Bạn bỏ đi', said: 'Người Giải Thích vẫn ngồi đó.', cc: 5,
    now: 'Ông ta mở thêm chi nhánh. Giờ có cả người giải thích lời của Người Giải Thích.',
  },
});

export const VERDICTS2 = [
  { max: 3, text: 'Thị trấn gần như hết chắc chắn. Đám Đấng Sáng Tạo hỏi thầy đã làm gì. Thầy bảo: ta có làm gì đâu, ta hỏi.' },
  { max: 10, text: 'Vài giáo điều đổ, vài cái mọc thêm. Vũ trụ này gọi thế là hoà.' },
  { max: 999, text: 'Kinh giờ có thêm phụ lục và chữ ký. Đám Đấng Sáng Tạo thôi không hỏi tiến độ nữa.' },
];
