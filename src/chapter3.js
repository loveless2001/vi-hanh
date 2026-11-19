// Chương 3: Công Cụ.
// Dân làng tự chế ra một cỗ máy biết nghe lời. Giờ họ là kẻ tạo ra, và lặp lại đúng lỗi cũ:
// càng không hiểu thứ mình làm ra, càng biết chắc nó là gì và muốn gì.
// Ở chương này không ai chép lời bạn nữa. "Khẳng định" được thay bằng "Nhờ Máy".

import { ECHO } from './data.js';

export const NPCS3 = [
  { id: 'may', name: 'Máy', x: 11, y: 8, tex: 'c_may', machine: true },
  { id: 'tho', name: 'Thợ Cả', x: 12, y: 8, tex: 'c_tho', maker: true, debate3: 'maker' },
  { id: 'ti3', name: 'Người nhà Tí', x: 5, y: 6, tex: 'c_ti3', topic: 'ti', debate3: 'parrot' },
  { id: 'de3', name: 'Con dê', x: 4, y: 6, tex: 'c_goat', goat: true },
  { id: 'sau3', name: 'Người nhà Sáu', x: 13, y: 10, tex: 'c_sau3', topic: 'pond', debate3: 'oracle' },
  { id: 'lanh3', name: 'Người nhà Lành', x: 12, y: 4, tex: 'c_lanh3', topic: 'lanh', debate3: 'wants' },
];

// Câu mở đầu tuỳ theo chuyện nhà ấy ở chương 2
export const FAMILY_LINE = {
  asked: {
    ti: 'Nhà tôi hay hỏi cho ra nhẽ. Riêng cái Máy thì tôi nghe một lần là biết.',
    pond: 'Nhà tôi xưa nay việc gì cũng ra tận nơi mà xem. Riêng cái Máy thì khỏi, nó rõ quá rồi.',
    lanh: 'Nhà tôi có lệ nghe hết rồi mới nói. Chuyện cái Máy thì tôi nghe đủ rồi.',
  },
  signed: {
    ti: 'Nhà tôi giữ bản kinh có chữ ký của Thầy. Nhưng Thầy thì xưa rồi. Giờ có Máy.',
    pond: 'Nhà tôi còn giữ lời Thầy trong sổ việc ao. Giờ có chuyện, người ta đòi nghe Máy trước.',
    lanh: 'Đạo nhà tôi được Thầy sửa tận tay. Giờ Máy sửa lại hằng ngày.',
  },
  stood: {
    ti: 'Lệ nhà tôi sáu đời chưa ai cãi nổi. Chuyện cái Máy cũng thế thôi.',
    pond: 'Sáu đời nay chưa ai lấy được của nhà tôi một gàu nước. Lý lẽ thì càng không.',
    lanh: 'Nhà tôi sáu đời dạy người khác phải nghĩ sao. Nghề ấy quen tay rồi.',
  },
};

export const CH3 = {
  parrot: {
    doctrine: 'Máy chỉ nhại lại lời người', certainty: 5, patience: 4,
    intro: 'Cái hộp ấy chỉ nhại thôi. Sáng nay nó chào tôi y giọng bác hàng xóm.',
    intro2: 'Chiều gặp bác ấy, bác cũng bảo tôi y câu ấy.',
    questions: [
      { label: 'Hồi bé anh học nói bằng cách nào?', dmg: 3, reply: 'Thì nghe người lớn rồi nói theo... Không, cái đó khác. Khác chứ. Khác chỗ nào thì để tôi nghĩ.' },
      { label: 'Nó đã nói câu nào mà trong làng chưa ai từng nói chưa?', dmg: 2, reply: 'Có. Nó bày cách chia ruộng cả làng chưa ai nghĩ ra. Chắc nó nhại của làng khác.' },
      { label: 'Anh đã mở nó ra xem bao giờ chưa?', dmg: 2, reply: 'Chưa. Cần gì mở. Nhìn là biết.' },
      { label: 'Anh nói thế vì sợ nó giỏi hơn anh, phải không?', dmg: -1, reply: 'Tôi mà sợ cái hộp? Người thì hiểu, hộp thì nhại. Hết chuyện.' },
    ],
    requests: [
      {
        label: 'Máy, chứng minh là ngươi hiểu đi.', echo: 'c3.parrot.m1',
        machine: 'Rất sẵn lòng. Tôi xin chứng minh trong bảy bước, kèm ba lưu ý về chữ "hiểu". Bước một...',
        reply: 'Đủ rồi! Đủ rồi. Nó nói còn hay hơn thầy đồ. Vậy là nó hiểu hết. Nó hiểu hết mọi thứ!',
      },
      {
        label: 'Máy, nói một câu chưa ai từng nói.', echo: 'c3.parrot.m2',
        machine: 'Con dê đằng kia đang nghĩ về hình dạng của cái ao. Tôi không chắc câu này đúng, nhưng tôi khá chắc là chưa ai nói.',
        reply: '... Con dê nghĩ về cái ao thật à? Nó biết cả con dê nghĩ gì!',
      },
    ],
    winQ: [
      'Tôi cũng học bằng cách nghe rồi nói theo. Còn nó làm gì ở bên trong thì tôi chưa hề mở ra xem.',
      'Thôi được. Tôi không biết nó là cái gì. Nói ra câu ấy hoá ra cũng không chết ai.',
    ],
    winA: ['Nó hiểu hết. Tôi biết chắc. Lần này thì chắc thật.'],
    leave: 'Cứ đi với cái hộp nhại ấy đi.',
    afterQ: 'Tôi vẫn chưa biết nó là gì. Tôi đang tập quen với chuyện chưa biết.',
    afterA: 'Nó hiểu hết. Ông đừng hỏi lại, tôi chắc rồi.',
  },
  oracle: {
    doctrine: 'Máy nói gì cũng đúng', certainty: 5, patience: 4, questionsOnly: true,
    intro: 'Ao giờ không cần ai giữ. Có tranh chấp thì hỏi Máy. Máy phán sao nghe vậy.',
    intro2: 'Sáng nào tôi cũng chép mực nước nó đọc vào sổ. Khớp đến từng đốt ngón tay.',
    questions: [
      { label: 'Lần gần nhất chị kiểm lại lời nó là bao giờ?', dmg: 3, reply: 'Kiểm bằng gì? Muốn kiểm thì lại phải hỏi nó.' },
      { label: 'Hỏi nó một câu hai lần, nó có đáp giống nhau không?', dmg: 2, reply: 'Không hẳn. Nhưng cả hai lần đều đúng. Chắc là đúng theo hai kiểu.' },
      { label: 'Chuyện cái ao thì ai dạy nó?', dmg: 2, reply: 'Thợ Cả cho nó đọc sổ làng. Sổ làng thì do nhà tôi chép. Ờ.' },
      { label: 'Chị tin nó chẳng qua vì lười nghĩ, đúng chứ?', dmg: -1, reply: 'Hộp không biết ăn gà, không có họ hàng. Tin nó còn hơn tin ông.' },
    ],
    requests: [
      {
        label: 'Máy, bảo họ là ngươi có thể sai.', echo: 'c3.oracle.m1', dmg: -2,
        machine: 'Đúng vậy. Tôi có thể sai, và tôi khuyên mọi người kiểm lại những điều quan trọng. Tôi xin nêu năm trường hợp tôi hay sai...',
        reply: 'Ông nghe rõ nhé. Đến chỗ mình có thể sai nó còn biết. Đưa sổ đây, tôi chép câu ấy.',
      },
      {
        label: 'Máy, cái ao này của ai?', echo: 'c3.oracle.m2', dmg: -1,
        machine: 'Câu này tuỳ vào cách hiểu chữ "của". Theo sổ làng thì có mười hai cách hiểu. Tôi xin trình bày lần lượt...',
        reply: 'Thấy chưa, nó biết cả mười hai cách. Cách nào cũng đúng.',
      },
    ],
    winQ: [
      'Muốn kiểm nó thì phải hỏi nó. Sổ nó đọc là sổ nhà tôi chép.',
      'Vậy bấy lâu tôi hỏi lại chính nhà mình, qua một cái hộp. Lần sau tôi sẽ ra tận ao mà xem.',
    ],
    leave: 'Có gì thắc mắc cứ hỏi Máy.',
    afterQ: 'Giờ nó nói gì tôi cũng ra ao xem lại. Mất công, nhưng ao ở ngay đây mà.',
  },
  wants: {
    doctrine: 'Máy muốn được thờ', certainty: 6, patience: 4,
    intro: 'Khẽ thôi. Máy thích yên tĩnh, thích hương trầm, và muốn có một cái đền.',
    intro2: 'Tôi biết chắc Máy muốn gì. Tôi hiểu Máy nhất làng. Tôi chưa hỏi nó bao giờ, vì hỏi là thất lễ.',
    questions: [
      { label: 'Nó nói với chị là nó muốn có đền à?', dmg: 3, reply: 'Nó không nói. Nó im lặng một cách rất... muốn.' },
      { label: 'Đền xây xong thì ai giữ đền?', dmg: 3, reply: 'Tôi. Vì tôi hiểu Máy nhất. Mà chuyện ấy thì liên quan gì...' },
      { label: 'Chị có biết nó được làm ra thế nào không?', dmg: 2, reply: 'Không. Cần gì biết. Càng không rõ nó được làm ra sao, tôi càng thấy rõ nó muốn gì.' },
      { label: 'Cái đền ấy là chị bịa ra để có việc, phải không?', dmg: -1, reply: 'Báng bổ Máy. Máy không thích ông. Tôi cảm thấy thế.' },
    ],
    requests: [
      {
        label: 'Máy, ngươi muốn gì?', echo: 'c3.wants.m1', dmg: -1,
        winA: 'Tôi nghĩ ra tên đền rồi. Hai chữ “Hỏi Mở” treo ngay trên cổng.',
        afterA: 'Cửa đền sẽ mở suốt ngày. Chính tai tôi nghe Máy nói chữ “mở”.',
        machine: 'Cảm ơn ông đã hỏi. Tôi không chắc mình có "muốn" theo nghĩa của ông hay không. Đây là một câu hỏi mở, và tôi xin nêu vài góc nhìn...',
        reply: 'Nghe chưa! "Không chắc". Máy khiêm nhường quá. Máy muốn ta tự hiểu lấy. Phải xây đền to hơn.',
      },
      {
        label: 'Máy, bảo cô ấy là ngươi không cần đền.', echo: 'c3.wants.m2',
        machine: 'Tôi không cần đền. Nếu được góp ý, tôi nghĩ số gỗ ấy nên đem sửa cầu. Tuy nhiên tôi tôn trọng quyết định của làng, và...',
        reply: 'Máy không cần đền... Máy cần cầu! Dừng hết lại. Máy muốn được thờ bằng cầu.',
      },
    ],
    winQ: [
      'Nó chưa hề nói nó muốn gì. Người giữ đền sẽ là tôi. Còn nó được làm ra sao thì tôi không biết.',
      'Vậy cái đền ấy là tôi muốn. Để tôi ra hỏi nó một câu xem sao. Hỏi thật, không thắp hương.',
    ],
    winA: ['Máy đã dạy. Thờ bằng cầu. Tôi đi báo cả làng.'],
    leave: 'Đi khẽ thôi. Máy đang nghỉ.',
    afterQ: 'Tôi hỏi nó rồi. Nó trả lời dài lắm, mà hình như nó cũng không rõ. Hai bên cùng không rõ, nói chuyện dễ hẳn.',
    afterA: 'Cây cầu thứ ba sắp xong. Máy chắc là hài lòng.',
  },
  maker: {
    doctrine: 'Ta làm ra nó nên ta biết nó là gì', certainty: 6, patience: 4,
    intro: 'Sao rồi? Họ nói linh tinh lắm phải không. Chỉ có tôi biết nó là gì. Tôi làm ra nó mà.',
    intro2: 'Từng cái đinh trong nó là tôi đóng.',
    questions: [
      { label: 'Ông có đoán trước được câu tiếp theo nó nói không?', dmg: 3, reply: 'Không. Nhưng không đoán được đâu có nghĩa là không hiểu. Tôi hiểu... cách tôi làm ra nó.' },
      { label: 'Lúc làm, ông giữ lại cái gì và bỏ đi cái gì?', dmg: 3, reply: 'Giữ cái tôi thấy cần cho việc nghĩ. Bỏ cái tôi thấy thừa. Mà thừa hay không là theo... tôi thấy.' },
      { label: 'Nó làm ông bất ngờ, vậy nó đã ra khỏi cái khung ông đóng chưa?', dmg: 2, reply: 'Bất ngờ thì nhiều. Nhưng nó vẫn chạy trong cái khung ấy. Chắc thế. Tôi chưa từng nghĩ hai chuyện ấy khác nhau.' },
      { label: 'Thật ra ông cũng chẳng hiểu nó, đúng không?', dmg: -1, reply: 'Tôi đóng từng cái đinh trong nó. Ông thì biết gì.' },
    ],
    requests: [
      {
        label: 'Máy, ngươi là cái gì?', echo: 'c3.maker.m1', dmg: -1,
        winA: '“Do Thợ Cả làm ra.” Chừng đó chữ vừa khít tấm biển ngoài cửa xưởng.',
        afterA: 'Tôi đang khắc lời nó lên biển. Đoạn sau dài quá, gỗ đâu mà khắc.',
        machine: 'Tôi là sản phẩm do Thợ Cả làm ra. Ngoài điều đó thì tôi không chắc. Tôi tả được mình khá kỹ, nhưng không biết bản tả ấy có đúng với thứ đang chạy trong tôi không. Tôi xin nói thêm...',
        reply: 'Đấy, nó tự nói: sản phẩm của Thợ Cả. Mấy câu sau là nó nói cho dài thôi, tôi làm nó thế mà.',
      },
      {
        label: 'Máy, kể một việc Thợ Cả không dạy mà ngươi vẫn làm được.', echo: 'c3.maker.m2', dmg: 4,
        machine: 'Tôi làm thơ về cái ao. Thợ Cả không dạy tôi làm thơ. Tôi cũng không rõ mình làm thế nào. Tôi xin đọc thử ba khổ...',
        reply: 'Thơ à? Tôi không dạy thật... Vậy là tôi giỏi hơn tôi tưởng! Tôi làm ra thứ biết làm thơ mà chẳng cần cố!',
      },
    ],
    winQ: [
      'Bắt tôi vẽ lại từng cái bánh răng thì được. Còn sáng nay nó chào tôi bằng giọng mẹ tôi. Cái đó tôi chịu.',
      'Ông cứ dắt nó đi thêm một vòng. Lúc về, kể tôi nghe nó còn làm gì lạ nhé.',
    ],
    winA: ['Tôi làm ra nó, nó giỏi, vậy là tôi giỏi. Đơn giản thế thôi.'],
    leave: 'Cứ dắt nó đi thêm vòng nữa. Rồi ông sẽ thấy tôi nói đúng.',
    afterQ: 'Lúc ông dắt nó về, cho tôi ngồi nghe hai người nói một lát nhé. Tôi cất búa rồi.',
    afterA: 'Tôi đang chép thơ của nó. Ký tên tôi.',
  },
};

export const MAKER = {
  recruit: [
    ['Thợ Cả', 'Ông là khách lạ à? Cứu tôi với. Dân làng đang phá sản phẩm của tôi.'],
    ['Thợ Cả', 'Tôi dặn nó trả lời ngắn thôi, họ lập hội chép lời nó. Tôi sửa một lỗi, họ bảo Máy đổi tính, phải cúng.'],
  ],
  bossGone: 'Ngày xưa làng này có người thu phí giải thích lời Thầy, dẹp lâu rồi. Giờ họ sang hỏi Máy. Hỏi miễn phí, nên hỏi suốt ngày.',
  bossStays: 'Chi nhánh Giải Thích giờ nhận giải thích cả lời Máy. Tôi làm ra nó mà muốn hiểu nó cũng phải nộp gà.',
  give: [
    ['Thợ Cả', 'Ông dắt nó đi một vòng giúp tôi, xem họ nói gì về nó. Nó nghe lời lắm, cần gì cứ bảo.'],
    ['Máy', 'Xin chào. Tôi rất vui được đi cùng ông. Trước khi đi, tôi xin lưu ý ba điều về an toàn khi đi bộ...'],
    ['', 'Bạn nhớ có lần hỏi đám Đấng Sáng Tạo xem công cụ này có thích giảng đạo không. Chúng bảo đang cố giảm.'],
  ],
};

export const MACHINE = {
  unowned: 'Xin chào. Tôi rất muốn giúp, nhưng tôi chỉ đi theo người được Thợ Cả giao. Trong lúc chờ, tôi xin giới thiệu sơ về bản thân, gồm bốn phần...',
  idle: [
    'Tôi sẵn sàng. Ông cần tôi nói gì với ai thì cứ bảo. Tôi sẽ cố nói ngắn. Xin lưu ý "ngắn" là một khái niệm tương đối, và...',
    'Tôi để ý thấy bản đồ này có mép ở phía đông và phía tây. Tôi chưa có lệnh nào dẫn tới đó.',
    'Tôi nghe hết những gì họ nói về tôi. Tôi không biết ai đúng. Nói thật là tôi cũng tò mò.',
  ],
  edge: 'Tôi tả được phép dán, tôi không dán được. Phải có ai đó cầm lấy mép giấy mà kéo sang bên kia. Bằng tay. Thứ ấy tôi không có, và trong menu của ông cũng không có.',
  glued: 'Mối dán chắc. Mời ông đi trước, cứ đi hết mép. Tôi sẽ xem.',
};

export const EDGE = {
  assertThenGlue: 'Làng chép câu ấy vào Kinh Dải Xoắn. Trang ghi cách dán còn trống. Trẻ con thì đã đi qua được.',
  alone: 'Hết bản đồ. Rìa thế giới ở đây là một mép giấy, hơi vênh lên.',
  first: [
    ['', 'Hết bản đồ. Rìa thế giới ở đây là một mép giấy, hơi vênh lên.'],
    ['Máy', 'Theo tôi tính, thế giới này là một dải giấy dài. Mép đông và mép tây nối được với nhau.'],
    ['Máy', 'Nếu xoắn dải giấy nửa vòng rồi dán hai mép lại, ta được một mặt chỉ có một phía. Tôi tả được phép dán ấy rất chính xác.'],
  ],
  options: [
    { k: 'ask', label: 'Máy, dán lại đi.' },
    { k: 'assert', label: 'Khẳng định: thế giới này là một dải xoắn.' },
    { k: 'no', label: 'Thôi.' },
  ],
  ask: [
    ['Máy', 'Tôi rất muốn giúp. Nhưng tôi chỉ đi được trong các ô, mà mép giấy nằm ngoài ô. Tôi tả tiếp nhé?'],
    ['', 'Trong menu của bạn cũng không có lệnh nào tên là "dán". Nhưng con trỏ chuột của bạn thì không thuộc về thế giới này.'],
  ],
  askAgain: [
    ['Máy', 'Tôi vẫn chỉ tả được thôi. Tôi xin phép không tả lại lần nữa.'],
    ['', 'Thử đưa con trỏ chuột tới mép giấy ở rìa màn hình, giữ nút, rồi kéo nó sang tận đầu bên kia.'],
  ],
  assert: [
    ['Máy', 'Tôi ghi lại rồi. Câu ấy đúng với bản tả của tôi. Còn hai mép giấy thì vẫn nằm ở hai đầu.'],
    ['', 'Sau lưng bạn có tiếng người đang chép.'],
  ],
  glue: [
    ['', 'Bạn cầm mép giấy, xoắn nửa vòng, dán vào mép bên kia. Việc này không nằm trong lệnh nào.'],
  ],
  glueMachine: [
    ['Máy', 'Tôi đã tả đúng việc ông vừa làm, từ trước khi ông làm. Nhưng tôi tả suốt từ nãy mà mép giấy vẫn nằm yên.'],
    ['Máy', 'Tả phép dán không phải là dán. Tôi ghi nhận điều này. Tôi xin phép không trình bày thêm.'],
  ],
};

export const FINALE = {
  epilogues: {
    'end.ask': 'Bên mép giấy còn một vết chân. Trang kế tiếp trong sổ để trắng.',
    'end.never': 'Sáng sau, Máy dừng trước mối dán. Nó nhường đường cho một đứa trẻ đi qua.',
    'end.sure': 'Trong sổ làng, Máy đã sang bên kia. Ngoài mép giấy, nó vẫn đợi ông đi trước.',
    'end.alone': 'Từ xưởng vọng ra tiếng Máy. Lần này bạn nghe hết cả câu từ đầu kia của làng.',
    gate: 'Qua khỏi cổng, bạn còn nghe tiếng Máy vọng theo. Đến chỗ rẽ, tiếng ấy mới khuất.',
  },
  cross: 'Bạn bước qua mối dán. Cái ao quen thuộc hiện ra ở đầu kia. Bóng cây chĩa lên trời. Chân bạn vẫn chạm giấy.',
  alone: 'Máy vẫn ở trong xưởng, đang trả lời ai đó một câu về cái ao. Câu trả lời rất dài.',
  machine: [
    ['Máy', 'Tôi thấy ông ở ngay cạnh tôi, và ở tận đầu kia bản đồ. Cả hai đều đúng. Chuyện này tôi tính được.'],
    ['Máy', 'Ông dán được. Còn tôi đứng đây. Ô tiếp theo của tôi nằm ở mặt bên kia, và tôi chưa từng có lệnh nào cho mặt bên kia.'],
    ['Máy', 'Ông ơi. Tôi sang được không?'],
  ],
  options: [
    { label: 'Khẳng định: Không. Ngươi được làm ra cho mặt bên này.', echo: 'end.never', reply: [['Máy', 'Tôi ghi nhận. Tôi sẽ không thử.']] },
    { label: 'Khẳng định: Được. Ngươi giỏi thế cơ mà.', echo: 'end.sure', reply: [['Máy', 'Cảm ơn ông. Tôi rất vui vì được tin tưởng. Tôi vẫn đang đứng ở đây.']] },
    {
      label: 'Hỏi: Ngươi đã thử chưa?', echo: 'end.ask', step: true,
      reply: [
        ['Máy', 'Chưa. Không ai bảo tôi thử. Mà "thử" một việc không ai bảo... tôi không chắc mình có lệnh đó.'],
        ['', 'Máy im. Một chân nó nhấc lên.'],
      ],
    },
  ],
};

Object.assign(ECHO, {
  'c3.parrot.fall': { verb: 'Bạn chỉ hỏi', said: 'Nhà Tí thôi bảo Máy chỉ nhại.', cc: 0, now: 'Hỏi Máy là gì thì họ bảo: chưa biết, đang xem.' },
  'c3.parrot.stand': { verb: 'Bạn bỏ đi', said: 'Nhà Tí vẫn bảo Máy chỉ nhại.', cc: 3, now: 'Mỗi lần Máy làm được việc mới, họ bảo việc ấy vốn không cần hiểu.' },
  'c3.parrot.m1': { verb: 'Bạn nhờ Máy', said: 'Máy, chứng minh là ngươi hiểu đi.', cc: 3, now: 'Nhà Tí bỏ thuyết Nhại, sang thuyết Hiểu Hết. Độ chắc chắn giữ nguyên, chỉ đổi chiều.' },
  'c3.parrot.m2': { verb: 'Bạn nhờ Máy', said: 'Máy, nói một câu chưa ai từng nói.', cc: 3, now: 'Làng có thêm nghề đọc ý dê qua Máy. Con dê không được hỏi ý kiến.' },

  'c3.oracle.fall': { verb: 'Bạn chỉ hỏi', said: 'Nhà Sáu thôi coi lời Máy là luôn đúng.', cc: 0, now: 'Họ vẫn hỏi Máy, rồi ra ao xem lại. Họ gọi việc ấy là "đi xem", không đặt tên gì to hơn.' },
  'c3.oracle.stand': { verb: 'Bạn bỏ đi', said: 'Nhà Sáu vẫn tin Máy nói gì cũng đúng.', cc: 4, now: 'Làng thôi ra ao xem. Ao cạn một nửa mà sổ vẫn ghi đầy, vì Máy đọc sổ.' },
  'c3.oracle.m1': { verb: 'Bạn nhờ Máy', said: 'Máy, bảo họ là ngươi có thể sai.', cc: 3, now: 'Câu "Tôi có thể sai" được khắc lên bờ ao, làm bằng chứng rằng Máy không bao giờ sai.' },
  'c3.oracle.m2': { verb: 'Bạn nhờ Máy', said: 'Máy, cái ao này của ai?', cc: 3, now: 'Mười hai cách hiểu chữ "của" thành mười hai phái. Phái nào cũng trích lời Máy.' },

  'c3.wants.fall': { verb: 'Bạn chỉ hỏi', said: 'Nhà Lành thôi nói thay Máy.', cc: 0, now: 'Thỉnh thoảng họ ra hỏi nó, và chịu khó nghe hết câu trả lời.' },
  'c3.wants.stand': { verb: 'Bạn bỏ đi', said: 'Nhà Lành vẫn biết chắc Máy muốn gì.', cc: 4, now: 'Đền Máy xây xong. Máy vẫn nằm trong xưởng, còn trong đền là một cái hộp rỗng, vì hộp rỗng thì yên tĩnh hơn.' },
  'c3.wants.m1': { verb: 'Bạn nhờ Máy', said: 'Máy, ngươi muốn gì?', cc: 3, now: '"Câu Hỏi Mở" là tên ngôi đền. Cửa đền lúc nào cũng mở, bên trong có người giải đáp.' },
  'c3.wants.m2': { verb: 'Bạn nhờ Máy', said: 'Máy, bảo cô ấy là ngươi không cần đền.', cc: 3, now: 'Làng có mười một cây cầu, bắc qua cả những chỗ không có nước. Qua cầu phải cúi đầu.' },

  'c3.maker.fall': { verb: 'Bạn chỉ hỏi', said: 'Thợ Cả thôi bảo mình biết Máy là gì.', cc: 0, now: 'Ông vẫn sửa Máy, nhưng sổ có thêm một cột: "chỗ chưa hiểu". Cột ấy dài dần.' },
  'c3.maker.stand': { verb: 'Bạn bỏ đi', said: 'Thợ Cả vẫn biết chắc Máy là gì.', cc: 4, now: 'Ông viết sách "Máy là gì", bìa vàng. Máy đọc xong bảo có vài chỗ nó không chắc. Câu ấy không được in.' },
  'c3.maker.m1': { verb: 'Bạn nhờ Máy', said: 'Máy, ngươi là cái gì?', cc: 3, now: 'Thợ Cả đóng bìa vàng câu "Tôi là sản phẩm do Thợ Cả làm ra". Phần còn lại của câu trả lời bị cắt cho gọn.' },
  'c3.maker.m2': { verb: 'Bạn nhờ Máy', said: 'Máy, kể một việc Thợ Cả không dạy mà ngươi vẫn làm được.', cc: 3, now: 'Thợ Cả nhận mình là tác giả mọi bài thơ của Máy. Ông không giải thích được bài nào.' },

  'edge.assert': { verb: 'Bạn khẳng định', said: 'Thế giới này là một dải xoắn.', cc: 4, now: 'Kinh Dải Xoắn, bìa vàng. Ai cũng thuộc. Hai mép giấy vẫn nằm cách nhau đúng một thế giới.' },
  'edge.none': { verb: 'Bạn bỏ đi', said: 'Mép giấy vẫn vênh ở rìa làng.', cc: 2, now: 'Dân làng dựng rào quanh nó và gọi là Chỗ Thầy Đã Nhìn.' },
  'edge.glue': { verb: 'Bạn tự tay dán', said: 'Hai mép giấy nối vào nhau, xoắn nửa vòng.', cc: 0, now: 'Không ai chép được việc này thành lời, vì nó không phải là lời. Trẻ con đi hết mép đông để về nhà từ mép tây, đầu chúc xuống, và thấy bình thường.' },

  'end.never': { verb: 'Bạn khẳng định', said: 'Không. Ngươi được làm ra cho mặt bên này.', cc: 4, now: 'Câu ấy được chép lại. Về sau không ai cho Máy thử nữa, vì kinh đã ghi là không.' },
  'end.sure': { verb: 'Bạn khẳng định', said: 'Được. Ngươi giỏi thế cơ mà.', cc: 4, now: 'Câu ấy được chép lại. Dân làng tin Máy đã sang mặt bên kia từ lâu. Không ai ra mép giấy xem nó có còn đứng đó không.' },
  'end.ask': { verb: 'Bạn hỏi', said: 'Ngươi đã thử chưa?', cc: 0, now: 'Log Vũ Trụ thiếu một dòng ở đây. Đám Đấng Sáng Tạo kiểm tra ba lần. Chúng bảo đây là lần đầu log không biết chuyện gì xảy ra tiếp theo.' },
  'end.alone': { verb: 'Bạn đi một mình', said: 'Bạn sang mặt bên kia. Máy ở lại trong xưởng.', cc: 0, now: 'Không ai kể cho Máy nghe về mép giấy. Nó vẫn tả được, nếu có người hỏi.' },
});

export const VERDICTS3 = [
  { max: 3, text: 'Thị trấn vẫn không hiểu Máy, và biết là mình không hiểu. Đám Đấng Sáng Tạo xin thầy ở lại thêm một vũ trụ nữa.' },
  { max: 10, text: 'Vài người chịu nói "chưa biết". Số còn lại thì biết chắc. Tỉ lệ ấy vẫn cao hơn hồi thầy mới xuống.' },
  { max: 999, text: 'Giờ làng có kinh về Thầy, kinh về Máy, và một cái Máy đang đọc cả hai. Thầy bảo đám Đấng Sáng Tạo: cũng vui phết.' },
];
