// Ba phần thêm: hành vi thành nghi lễ, người chép kinh, và vòng hai (đứa trẻ lớn lên giữa lời bạn để lại).

import { ECHO } from './data.js';

// ───────────────────────── Nghi lễ ─────────────────────────
// Những việc bạn vô tình làm ở chương 1. sign: chỗ dựng bia ở đời sau · text: chữ trên bia
// elder: câu người giữ lễ dạy trẻ con ở vòng hai

export const RITES = {
  goat: {
    sign: { x: 4, y: 7 },
    text: 'BIA: “Chào dê trước, chào người sau. Thầy đã làm thế.” Bên dưới có ai viết thêm bằng than: dê không chào lại.',
    elder: 'Sáng ra phải chào dê trước rồi mới được chào người. Thầy đã làm thế.',
  },
  pond: {
    sign: { x: 13, y: 11 },
    text: 'BIA: “Bờ tây là đất kiêng. Thầy không đi lối này.” Cỏ bờ tây mọc cao ngang ngực.',
    elder: 'Đi quanh ao thì tới bờ tây phải quay lại. Thầy không đi lối ấy.',
  },
  tree: {
    sign: { x: 10, y: 9 },
    text: 'BIA: “Chỗ Thầy đứng im. Giờ đứng im: mỗi chiều. Cấm gãi.”',
    elder: 'Mỗi chiều phải ra đứng im giữa làng. Thầy đã đứng im ở đấy.',
  },
  field: {
    sign: { x: 14, y: 7 },
    text: 'BIA: “Luống Thầy Giẫm. Cấm cấy.” Mấy luống đất bỏ hoang, cỏ mọc rất đều.',
    elder: 'Mấy luống đầu ruộng không được cấy. Thầy đã giẫm lên đó.',
  },
  door: {
    sign: { x: 2, y: 4 },
    text: 'BIA: “Nghe gõ thì đừng mở. Biết đâu là Thầy.” Cửa quanh đây đều chốt trong.',
    elder: 'Nghe gõ cửa thì không được ra mở. Biết đâu là Thầy.',
  },
};

Object.assign(ECHO, {
  'rite.goat': {
    verb: 'Bạn lỡ làm', said: 'Bạn hỏi chuyện con dê trước khi hỏi người.', cc: 1,
    now: 'Lệ Chào Dê: sáng ra phải chào dê trước rồi mới được chào nhau. Dê không chào lại, và điều ấy cũng đã có chú giải.',
  },
  'rite.pond': {
    verb: 'Bạn lỡ làm', said: 'Bạn đi quanh ba bờ ao, chừa bờ tây.', cc: 1,
    now: 'Lễ Ba Bờ: mỗi rằm cả làng đi quanh ao, tới bờ tây thì quay lại. Bờ tây thành đất kiêng. Hôm ấy chú Sáu đứng chắn ở đó.',
  },
  'rite.tree': {
    verb: 'Bạn lỡ làm', said: 'Bạn đứng im rất lâu cạnh cái cây cháy.', cc: 1,
    now: 'Giờ Đứng Im: mỗi chiều cả làng ra đứng im chỗ ấy. Ai gãi mũi phải đứng lại từ đầu.',
  },
  'rite.field': {
    verb: 'Bạn lỡ làm', said: 'Bạn giẫm qua ruộng lúa.', cc: 1,
    now: 'Luống Thầy Giẫm: mấy luống ấy bỏ hoang, không ai dám cấy. Thóc trong làng đắt lên một ít.',
  },
  'rite.door': {
    verb: 'Bạn lỡ làm', said: 'Bạn gõ một cánh cửa không ai mở.', cc: 1,
    now: 'Lệ Gõ Không Mở: nghe gõ cửa thì cấm ra mở, vì biết đâu là Thầy. Từ đó trong làng không ai sang chơi nhà ai.',
  },
});

// ───────────────────────── Người chép kinh ─────────────────────────
// Mỗi câu chỉ khắc được một nửa số chữ. keep: những chữ phải còn thì câu mới còn ý · drop: chữ mà còn thì hỏng ý

export const SCRIBE = {
  rules: {
    'thunder.a1': { keep: ['tiếng', 'chớp'] },
    'thunder.a2': { keep: ['không', 'cần'] },
    'thunder.a3': { keep: ['quen', 'kẻ'], drop: ['tin'] },
    'pond.a1': { keep: ['nước', 'chung'] },
    'pond.a2': { keep: ['ai', 'uống'] },
    'ti.sleep': { keep: ['nhóc'] },
    'ti.fear': { keep: ['không', 'sao'] },
    'lanh.pass': { keep: ['chỉ'] },
    'lanh.master': { keep: ['của', 'đứa'] },
  },
  intro: [
    'Bạn đi rồi. Đêm ấy có người ngồi khắc lại lời bạn lên thẻ tre, để đời sau còn đọc. Lần này người cầm dao khắc là bạn.',
    'Tre thì ngắn. Mỗi câu chỉ khắc được một nửa số chữ. Giữ chữ nào là tuỳ bạn. Đời sau chỉ đọc được những chữ ấy.',
  ],
  none: 'Bạn đi rồi. Đêm ấy có người ngồi trước thẻ tre, định khắc lại lời bạn. Bạn chỉ hỏi, nên không có câu nào để khắc. Người ấy khắc một dấu hỏi rồi đi ngủ.',
  outro: 'Ba thế hệ nữa, người ta sẽ dựng giáo điều trên mấy chữ này. Khắc còn ý thì giáo điều kém chắc đi một chút. Khắc mất ý thì nó chắc thêm.',
};

// ───────────────────────── Vòng hai ─────────────────────────
// L (di sản của lượt trước): { words: [{ said, kept }], rites: [khoá RITES], ti, glued, end }

export const DEMO_LEGACY = {
  words: [{ said: 'Ngủ sớm đi, nhóc.', kept: 'Ngủ sớm' }, { said: 'Nước là của chung.', kept: 'Nước chung' }],
  rites: ['goat', 'pond'], ti: 'ti.sleep', glued: true, end: 'end.ask',
};
export const BLANK_LEGACY = { words: [], rites: [], ti: 'ti.ask', glued: false, end: null };

export function round2(L) {
  const verse = L.words[0] ? (L.words[0].kept ?? L.words[0].said) : null;
  const wordCount = verse ? verse.split(' ').length : 0;
  const recites = L.words.slice(0, 2).map((w) => w.kept ?? w.said);
  const rite = RITES[L.rites[0]];

  const npcs = [
    { id: 'r2kinh', name: 'Cụ Giữ Kinh', x: 12, y: 8, tex: 'c_man2', debate4: 'kinh' },
    { id: 'r2may', name: 'Máy', x: 11, y: 8, tex: 'c_may', quiet: true, line: 'Máy vẫn đang nói dở một câu bắt đầu từ trước khi bạn sinh ra.' },
    { id: 'r2le', name: 'Bà Giữ Lễ', x: 13, y: 10, tex: 'c_lanh3', debate4: 'le' },
    { id: 'r2mep', name: 'Chú Giữ Mép', x: 5, y: 6, tex: 'c_sau3', debate4: 'mep' },
    { id: 'r2de', name: 'Con dê', x: 4, y: 6, tex: 'c_goat', goat: true },
  ];

  const debates = {
    kinh: {
      doctrine: verse ? `“${verse}”: thuộc trước, hiểu sau` : 'Trang trắng là lời Thầy dạy',
      intro: verse
        ? [`Đọc theo ta, nhóc: “${verse}”.`, 'Đọc cho thuộc. Nghĩa thì lớn lên khắc biết. Ta lớn rồi mà vẫn đang chờ.']
        : ['Kinh làng này không có chữ nào. Thầy ghé qua chỉ hỏi, không phán câu gì.', 'Nên trang trắng là lời dạy sâu nhất. Ngồi xuống nhìn trang trắng đi, nhóc. Cấm chớp mắt.'],
      questions: [
        verse
          ? { label: 'Lúc nói câu ấy, Thầy đang nói với ai hả cụ?', dmg: 3, reply: 'Với… Kinh không chép. Kinh chỉ chép lời, không chép người nghe.' }
          : { label: 'Thầy hỏi những gì hả cụ?', dmg: 3, reply: 'Không ai chép câu hỏi. Người ta chỉ chép câu trả lời, mà Thầy không trả lời. Nên trắng.' },
        verse
          ? { label: 'Thẻ tre gốc khắc được mấy chữ ạ?', dmg: 2, reply: `${wordCount} chữ. Nghe đồn Thầy nói dài hơn, nhưng đêm ấy hết tre.` }
          : { label: 'Người hồi ấy được Thầy hỏi thì sau ra sao ạ?', dmg: 2, reply: 'Họ tự nghĩ ra vài chuyện. Rồi con cháu họ dựng tượng họ, cấm hỏi. Ta cũng thấy chỗ ấy hơi kỳ.' },
        { label: 'Cụ đọc bao nhiêu năm rồi, nó có lần nào đổi nghĩa không ạ?', dmg: 2, reply: 'Mỗi lần ta đau lưng nó lại ra một nghĩa khác. Ta vẫn tưởng tại lưng.' },
        { label: 'Cụ cũng có hiểu gì đâu, đúng không ạ?', dmg: -1, reply: 'Hỗn. Ra góc kia chép phạt một trăm lần.' },
      ],
      recite: 'Giỏi! Thuộc cả câu ta chưa dạy. Đứa này phải cho ngồi cạnh bàn Giải Thích.',
      winQ: verse
        ? ['Một câu nói với ai đó, về chuyện gì đó, vào một buổi nào đó. Ta giữ nó cả đời mà không biết ba cái ấy.', 'Thôi, hôm nay nghỉ đọc. Con ra ngoài chơi đi.']
        : ['Thầy hỏi, người ta tự nghĩ. Thế mà ta bắt con ngồi nhìn giấy trắng.', 'Con đứng dậy đi. Muốn hỏi gì thì hỏi, ta không biết thì ta nói là không biết.'],
      winA: ['Con thuộc kinh hơn cả ta. Từ mai con ngồi ghế này, ta ngồi ghế dưới.'],
      leave: 'Chạy đâu? Chưa thuộc thì tối về đọc tiếp.',
      afterQ: 'Ta đang thử đoán xem hôm ấy Thầy nói với ai. Đoán thôi. Ta không chép lại đâu.',
      afterA: 'Ghế của con ta lau rồi. Mai nhớ đến sớm.',
    },
    le: {
      doctrine: rite ? 'Thầy làm gì cũng là dạy' : 'Thầy không làm gì thừa',
      intro: rite
        ? [rite.elder, 'Thầy làm gì cũng có ý cả. Mình chưa hiểu thì cứ làm theo cho đủ đã.']
        : ['Thầy đi thẳng từ cổng vào, không ghé đâu, không đứng lại chỗ nào.', 'Nên trẻ con làng này cấm la cà. Con đang la cà đấy.'],
      questions: [
        { label: 'Hôm ấy Thầy có biết là đang có người nhìn không ạ?', dmg: 3, reply: 'Chắc là… không. Người đang được nhìn thì đâu có đi đứng như thế.' },
        { label: 'Nếu hôm ấy Thầy vấp ngã thì giờ mình có lễ ngã không ạ?', dmg: 2, reply: 'Có chứ. … Ta vừa nói “có chứ” đấy à.' },
        { label: 'Con dê có phải giữ lễ không ạ?', dmg: 2, reply: 'Dê thì cứ sống như dê. Trời vẫn chưa đánh nó lần nào.' },
        { label: 'Lễ này vớ vẩn bà nhỉ?', dmg: -1, reply: 'Vớ vẩn là đứa không giữ lễ. Ra cổng đi lại vào đây, ba lần.' },
      ],
      recite: 'Ngoan. Biết lấy lời Thầy ra thưa với người lớn. Lễ nào cũng từ lời ấy mà ra cả.',
      winQ: ['Một người đi ngang qua làng, không biết có ai nhìn. Thế mà mình giữ từng bước chân của ông ấy.', 'Con đi lối nào thì đi. Ta ngồi nghỉ một lát.'],
      winA: ['Con thuộc lời Thầy thế thì sau này giữ lễ thay ta. Ta dạy con từ hôm nay.'],
      leave: 'Đi cho đúng lối đấy.',
      afterQ: 'Sáng nay ta quên giữ lễ. Tới trưa mới nhớ ra. Trời vẫn nắng.',
      afterA: 'Mai ta dạy con bài đầu: đi sao cho đúng dáng Thầy.',
    },
    mep: {
      doctrine: L.glued ? 'Thế giới chỉ có một mặt, là mặt này' : 'Ngoài mép giấy không có gì',
      intro: L.glued
        ? ['Mép làng dán kín rồi. Đi mãi thì về chỗ cũ, đầu lộn xuống đất. Thầy tự tay dán đấy.', 'Nên cấm đi thử. Thầy dán là để mình khỏi phải đi.']
        : ['Tới mép làng là hết. Thầy đã ra tới đó, nhìn một lúc, rồi quay về.', 'Thầy còn quay về thì mình ra đấy làm gì. Cấm tới gần.'],
      questions: [
        L.end === 'end.ask'
          ? { label: 'Đã có ai đi thử chưa ạ?', dmg: 3, reply: 'Có cái Máy. Người ta kể nó bước một bước, rồi sổ sách thôi không ghi gì về nó nữa.' }
          : { label: 'Đã có ai đi thử chưa ạ?', dmg: 3, reply: 'Chưa. Cấm mà. … Mà cấm từ bao giờ, ai cấm, ta cũng không rõ.' },
        { label: 'Chưa ai đi thì sao chú biết bên ấy thế nào ạ?', dmg: 3, reply: 'Kinh chép. Mà kinh thì… do người chưa đi chép.' },
        { label: 'Cái Máy trong xưởng nói gì về chỗ ấy ạ?', dmg: 1, reply: 'Nó nói dài lắm. Chưa ai nghe hết một câu, nên mỗi người trích một nửa.' },
        { label: 'Chú sợ nên mới cấm, phải không ạ?', dmg: -1, reply: 'Trẻ con biết gì mà sợ với không. Ra đứng úp mặt vào tường.' },
      ],
      recite: 'Đúng lời Thầy. Thầy đã nói thế thì còn ra mép làm gì nữa. Đứa bé này sáng dạ.',
      winQ: ['Người cấm chưa đi. Người chép chưa đi. Ta canh ở đây cả đời cũng chưa đi.', 'Ta không cấm con nữa. Nhưng lúc nào đi thì gọi ta, ta cũng muốn xem.'],
      winA: ['Con thuộc kinh thế thì ra đây canh mép với ta. Hai người canh thì chắc hơn một.'],
      leave: 'Đi chơi thì chơi trong làng thôi đấy.',
      afterQ: 'Ta đang buộc lại quai dép. Phòng khi con gọi.',
      afterA: 'Chỗ canh của con ở bên trái ta. Đứng cho thẳng.',
    },
  };

  const said = { 'ti.sleep': 'Ngủ sớm đi, nhóc.', 'ti.fear': 'Sợ thì cứ sợ, không sao cả.', 'ti.ask': 'Thế con nghĩ sấm là gì?' }[L.ti] ?? null;
  const stranger = {
    arrive: [
      'Ở cổng làng có một người lạ đang đi vào. Ông ấy nhìn quanh như người đi xem hội.',
      'Đêm qua có sấm. Mắt bạn còn thâm, và ông ấy nhìn thấy.',
    ],
    said,
    silent: 'Ông ấy đi ngang qua bạn. Không nói câu nào.',
    options: [
      {
        echo: 'r2.end.copy',
        label: said ? 'Chạy về khắc lại câu ấy.' : 'Chạy về kể: Thầy đi ngang mà không nói gì.',
        reply: [['', said ? 'Bạn khắc được nửa câu thì hết tre.' : 'Tối ấy cả làng bàn xem việc Thầy không nói gì có nghĩa là gì. Bạn được ngồi giữa.']],
      },
      {
        echo: 'r2.end.ask',
        label: L.ti === 'ti.ask' ? 'Con chưa biết. Còn ông nghĩ là gì ạ?' : said ? 'Ông nói thế là nói với ai ạ?' : 'Ông ơi, ông là ai ạ?',
        reply: [
          ['Người lạ', L.ti === 'ti.ask' ? 'Ta cũng đang đi hỏi đây.' : said ? 'Với con. Về tối nay. Chỉ thế thôi.' : 'Ta chỉ đi ngang qua. … Khoan, câu ấy đừng chép lại.'],
          ['', 'Ông ấy nhìn bạn khá lâu, rồi ghi gì đó vào sổ.'],
        ],
      },
      {
        echo: 'r2.end.ignore',
        label: 'Kệ ông ấy. Đi chơi.',
        reply: [['', 'Bạn chạy ra bờ ao. Người lạ đứng nhìn theo một lúc.']],
      },
    ],
  };

  Object.assign(ECHO, {
    'r2.end.copy': {
      verb: 'Bạn chép lại', said: said ?? 'Thầy đi ngang mà không nói gì.', cc: 4,
      now: 'Bạn là người chép đầu tiên của bộ kinh mới. Bạn biết rõ nó bị chép thiếu thế nào, vì chính bạn chép.',
    },
    'r2.end.ask': {
      verb: 'Bạn hỏi lại', said: stranger.options[1].label, cc: 0,
      now: 'Không có gì để chép. Người lạ ghi vào sổ của ông ấy: “Có một đứa hỏi lại.” Đám Đấng Sáng Tạo đọc dòng ấy rất lâu.',
    },
    'r2.end.ignore': {
      verb: 'Bạn bỏ đi', said: 'Kệ ông ấy. Đi chơi.', cc: 1,
      now: 'Bạn lớn lên không theo kinh nào. Làng gọi thế là Đạo Kệ. Đạo Kệ hiện có ba điều răn.',
    },
  });

  return { npcs, debates, recites, stranger };
}

export const ROUND2_TEXT = {
  enter: [
    'Bạn sinh ra ở thị trấn này, rất lâu sau khi có một người lạ ghé qua. Năm nay bạn bảy tuổi. Đêm qua có sấm.',
    'Người lớn bảo câu trả lời nào cũng đã có trong kinh. Kinh ấy do ai nói ra thì bạn không nhớ. Lẽ ra bạn phải nhớ.',
  ],
  note: 'Bạn là trẻ con. Không ai chép lời bạn. Người lớn chỉ chịu nghe hỏi vài câu.',
  epilogues: {
    'r2.end.copy': 'Lượt trước bạn nói, người khác chép. Lượt này bạn tự chép. Bộ kinh chỉ đổi người cầm dao.',
    'r2.end.ask': 'Bạn làm ông ấy ngạc nhiên. Bạn vẫn sống trong thị trấn mọc lên từ lời ông ấy. Cả hai điều cùng đúng.',
    'r2.end.ignore': 'Bạn không theo kinh nào, và việc ấy cũng được chép lại. Muốn ra khỏi một bộ kinh, quay lưng với nó là chưa đủ.',
  },
};

export const VERDICTS4 = [
  { max: 1, text: 'Mấy người lớn thôi chắc chắn, vì một đứa trẻ hỏi. Không ai ghi tên đứa trẻ ấy.' },
  { max: 8, text: 'Vài điều đổ, vài điều bạn học thuộc. Bạn lớn lên thành một người làng bình thường.' },
  { max: 999, text: 'Bạn thuộc kinh hơn cả người giữ kinh. Hai mươi năm nữa, cái bàn Giải Thích là của bạn.' },
];
