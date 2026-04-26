export type Ohang = '목' | '화' | '토' | '금' | '수'

export type Sipsung =
  | '비견'
  | '겁재'
  | '식신'
  | '상관'
  | '편재'
  | '정재'
  | '편관'
  | '정관'
  | '편인'
  | '정인'

export type SipsungGroup = '비겁' | '식상' | '재성' | '관성' | '인성'

export interface ReportUserData {
  userName: string
  ilgan: string
  dominantOhang: Ohang
  topSipsung: Sipsung
  secondSipsung: Sipsung
  deficientOhang: Ohang[]
  excessiveOhang: Ohang[]
  deficientSipsungGroups: SipsungGroup[]
  excessiveSipsungGroups: SipsungGroup[]
}

type DayMaster = '갑(甲)' | '을(乙)' | '병(丙)' | '정(丁)' | '무(戊)' | '기(己)' | '경(庚)' | '신(辛)' | '임(壬)' | '계(癸)'
type TopElement = '목(木)' | '화(火)' | '토(土)' | '금(金)' | '수(水)'

interface HeadlineRow {
  dayMaster: DayMaster
  topElement: TopElement
  headlineTitle: string
  headlineSubtitle: string
}

interface WeaponRow {
  sipsung: Sipsung
  text: string
}

interface OhangWeaponRow {
  ohang: Ohang
  text: string
}

interface AchillesRow {
  condition: string
  achillesIntro: string
  achillesText: string
}

interface MissionRow {
  mainStar: Sipsung
  missionKeyword: string
  missionText: string
}

const DAY_MASTER_ALIAS_MAP: Record<string, DayMaster> = {
  '갑(甲)': '갑(甲)',
  갑: '갑(甲)',
  甲: '갑(甲)',
  '을(乙)': '을(乙)',
  을: '을(乙)',
  乙: '을(乙)',
  '병(丙)': '병(丙)',
  병: '병(丙)',
  丙: '병(丙)',
  '정(丁)': '정(丁)',
  정: '정(丁)',
  丁: '정(丁)',
  '무(戊)': '무(戊)',
  무: '무(戊)',
  戊: '무(戊)',
  '기(己)': '기(己)',
  기: '기(己)',
  己: '기(己)',
  '경(庚)': '경(庚)',
  경: '경(庚)',
  庚: '경(庚)',
  '신(辛)': '신(辛)',
  신: '신(辛)',
  辛: '신(辛)',
  '임(壬)': '임(壬)',
  임: '임(壬)',
  壬: '임(壬)',
  '계(癸)': '계(癸)',
  계: '계(癸)',
  癸: '계(癸)',
}

const OHANG_TO_TOP_ELEMENT: Record<Ohang, TopElement> = {
  목: '목(木)',
  화: '화(火)',
  토: '토(土)',
  금: '금(金)',
  수: '수(水)',
}

const HEADLINE_DB: HeadlineRow[] = [
  { dayMaster: '갑(甲)', topElement: '목(木)', headlineTitle: '깊은 산속에 뿌리내린 거대한 고목', headlineSubtitle: '흔들리지 않는 굳건한 뚝심의 소유자' },
  { dayMaster: '갑(甲)', topElement: '화(火)', headlineTitle: '태양 아래 활활 타오르는 붉은 나무', headlineSubtitle: '지치지 않는 열정과 화끈한 추진력' },
  { dayMaster: '갑(甲)', topElement: '토(土)', headlineTitle: '넓은 대지에 홀로 서 있는 나무', headlineSubtitle: '외롭지만 스스로 일어서는 독립적인 리더' },
  { dayMaster: '갑(甲)', topElement: '금(金)', headlineTitle: '도끼에 정교하게 다듬어진 단단한 재목', headlineSubtitle: '원칙을 중시하는 날카로운 완벽주의자' },
  { dayMaster: '갑(甲)', topElement: '수(水)', headlineTitle: '물기를 머금은 생명력 넘치는 숲', headlineSubtitle: '유연함과 포용력을 갖춘 지략가' },
  { dayMaster: '을(乙)', topElement: '목(木)', headlineTitle: '거센 바람에도 꺾이지 않는 질긴 덩굴', headlineSubtitle: '엄청난 생존력과 적응력을 가진 외유내강' },
  { dayMaster: '을(乙)', topElement: '화(火)', headlineTitle: '화려하게 만개한 들판의 꽃', headlineSubtitle: '사람들의 시선을 사로잡는 타고난 스타성' },
  { dayMaster: '을(乙)', topElement: '토(土)', headlineTitle: '드넓은 초원 위를 뒤덮은 푸른 잔디', headlineSubtitle: '어디서든 뿌리내리는 강한 현실 감각' },
  { dayMaster: '을(乙)', topElement: '금(金)', headlineTitle: '가위에 정교하게 다듬어진 분재', headlineSubtitle: '세련된 매너와 예리한 판단력의 소유자' },
  { dayMaster: '을(乙)', topElement: '수(水)', headlineTitle: '아침 이슬을 머금은 싱그러운 난초', headlineSubtitle: '감수성이 풍부하고 속이 깊은 평화주의자' },
  { dayMaster: '병(丙)', topElement: '목(木)', headlineTitle: '울창한 숲을 눈부시게 비추는 태양', headlineSubtitle: '주변 사람들을 키워주는 따뜻한 멘토' },
  { dayMaster: '병(丙)', topElement: '화(火)', headlineTitle: '세상을 삼킬 듯이 타오르는 용광로', headlineSubtitle: '멈출 줄 모르는 에너지를 가진 뜨거운 열정가' },
  { dayMaster: '병(丙)', topElement: '토(土)', headlineTitle: '사막 위를 비추는 묵직한 태양', headlineSubtitle: '과묵하고 묵직하게 자기 길을 가는 장인' },
  { dayMaster: '병(丙)', topElement: '금(金)', headlineTitle: '보석을 반짝이게 만드는 화려한 빛', headlineSubtitle: '결과를 만들어내는 현실적인 성취자' },
  { dayMaster: '병(丙)', topElement: '수(水)', headlineTitle: '바다 위로 떠오르는 붉은 태양', headlineSubtitle: '이상과 현실의 균형을 맞추는 조율자' },
  { dayMaster: '정(丁)', topElement: '목(木)', headlineTitle: '장작을 만나 타오르는 모닥불', headlineSubtitle: '끊임없이 새로운 것을 만들어내는 기획자' },
  { dayMaster: '정(丁)', topElement: '화(火)', headlineTitle: '밤하늘을 수놓은 수많은 별빛', headlineSubtitle: '섬세하고 감각적인 예술가 기질의 소유자' },
  { dayMaster: '정(丁)', topElement: '토(土)', headlineTitle: '도자기를 굽는 가마솥의 열기', headlineSubtitle: '하나에 꽂히면 파고드는 집념의 장인' },
  { dayMaster: '정(丁)', topElement: '금(金)', headlineTitle: '원석을 녹여 보석으로 만드는 불꽃', headlineSubtitle: '상황을 통제하고 결과를 도출하는 리더' },
  { dayMaster: '정(丁)', topElement: '수(水)', headlineTitle: '어두운 밤바다를 비추는 등대', headlineSubtitle: '혼란 속에서 길을 찾는 직관력의 소유자' },
  { dayMaster: '무(戊)', topElement: '목(木)', headlineTitle: '나무가 빼곡하게 들어선 거대한 산', headlineSubtitle: '책임감이 막중하고 속이 깊은 보호자' },
  { dayMaster: '무(戊)', topElement: '화(火)', headlineTitle: '언제 터질지 모르는 뜨거운 화산', headlineSubtitle: '폭발적인 잠재력을 숨긴 권력자' },
  { dayMaster: '무(戊)', topElement: '토(土)', headlineTitle: '끝이 보이지 않는 광활한 대륙', headlineSubtitle: '흔들림 없이 묵묵한 믿음의 상징' },
  { dayMaster: '무(戊)', topElement: '금(金)', headlineTitle: '거대한 황금맥을 품고 있는 광산', headlineSubtitle: '겉은 무뚝뚝하나 속은 꽉 찬 실속파' },
  { dayMaster: '무(戊)', topElement: '수(水)', headlineTitle: '엄청난 물을 가두고 있는 거대한 댐', headlineSubtitle: '위기 상황을 버텨내는 강인한 인내심' },
  { dayMaster: '기(己)', topElement: '목(木)', headlineTitle: '잡초가 무성하게 자라난 정원', headlineSubtitle: '바쁘게 움직이며 결과를 만드는 실무자' },
  { dayMaster: '기(己)', topElement: '화(火)', headlineTitle: '한겨울에도 따뜻한 비닐하우스', headlineSubtitle: '주변 사람을 편안하게 품어주는 다정함' },
  { dayMaster: '기(己)', topElement: '토(土)', headlineTitle: '무엇이든 심으면 자라나는 비옥한 땅', headlineSubtitle: '만물을 포용하는 어머니 같은 마음' },
  { dayMaster: '기(己)', topElement: '금(金)', headlineTitle: '보석이 묻혀있는 가치 있는 대지', headlineSubtitle: '치밀한 계산력과 숨겨진 재능의 소유자' },
  { dayMaster: '기(己)', topElement: '수(水)', headlineTitle: '물기를 머금은 부드러운 진흙', headlineSubtitle: '어떤 환경에도 맞춰주는 유연한 처세술' },
  { dayMaster: '경(庚)', topElement: '목(木)', headlineTitle: '울창한 숲을 벌목하는 무거운 도끼', headlineSubtitle: '목표를 향해 돌진하는 무서운 추진력' },
  { dayMaster: '경(庚)', topElement: '화(火)', headlineTitle: '제련소에서 단련되고 있는 강철', headlineSubtitle: '시련을 겪을수록 강해지는 승부사' },
  { dayMaster: '경(庚)', topElement: '토(土)', headlineTitle: '거대한 바위산에 숨겨진 철광석', headlineSubtitle: '듬직하고 속내를 쉽게 드러내지 않는 신중함' },
  { dayMaster: '경(庚)', topElement: '금(金)', headlineTitle: '날이 시퍼렇게 선 날카로운 검', headlineSubtitle: '맺고 끊음이 확실한 차가운 카리스마' },
  { dayMaster: '경(庚)', topElement: '수(水)', headlineTitle: '바위틈에서 솟아나는 차가운 폭포', headlineSubtitle: '맑고 깨끗하며 불의를 참지 못하는 결백함' },
  { dayMaster: '신(辛)', topElement: '목(木)', headlineTitle: '예쁜 상자에 담긴 귀한 보석', headlineSubtitle: '가치를 인정받고 싶어 하는 섬세한 자존심' },
  { dayMaster: '신(辛)', topElement: '화(火)', headlineTitle: '조명을 받고 있는 다이아몬드', headlineSubtitle: '주목받을 때 가장 빛나는 무대 체질' },
  { dayMaster: '신(辛)', topElement: '토(土)', headlineTitle: '흙 속에 묻혀 빛을 기다리는 원석', headlineSubtitle: '때를 기다리며 내공을 쌓고 있는 은둔자' },
  { dayMaster: '신(辛)', topElement: '금(金)', headlineTitle: '예리하게 세공된 날카로운 보석', headlineSubtitle: '흠집을 용납하지 않는 완벽주의와 예민함' },
  { dayMaster: '신(辛)', topElement: '수(水)', headlineTitle: '맑은 물에 씻겨 반짝이는 진주', headlineSubtitle: '뛰어난 두뇌와 세련된 감각의 소유자' },
  { dayMaster: '임(壬)', topElement: '목(木)', headlineTitle: '강물을 따라 떠내려가는 뗏목', headlineSubtitle: '자유로운 영혼과 넘치는 호기심' },
  { dayMaster: '임(壬)', topElement: '화(火)', headlineTitle: '붉은 노을이 비치는 광활한 바다', headlineSubtitle: '스케일이 크고 화려함을 쫓는 낭만주의자' },
  { dayMaster: '임(壬)', topElement: '토(土)', headlineTitle: '댐에 가로막혀 고여있는 강물', headlineSubtitle: '인내심이 강하고 속마음을 감추는 전략가' },
  { dayMaster: '임(壬)', topElement: '금(金)', headlineTitle: '끊임없이 솟아나는 거대한 수원지', headlineSubtitle: '마르지 않는 지혜와 풍부한 아이디어' },
  { dayMaster: '임(壬)', topElement: '수(水)', headlineTitle: '끝없이 깊고 넓은 검은 심해', headlineSubtitle: '속을 알 수 없는 지혜와 압도적 포용력' },
  { dayMaster: '계(癸)', topElement: '목(木)', headlineTitle: '숲의 생명을 키워내는 단비', headlineSubtitle: '타인에게 활력을 주는 헌신적인 서포터' },
  { dayMaster: '계(癸)', topElement: '화(火)', headlineTitle: '비 온 뒤에 떠오르는 무지개', headlineSubtitle: '다재다능하고 예술적 감각이 뛰어난 매력' },
  { dayMaster: '계(癸)', topElement: '토(土)', headlineTitle: '마른 땅을 적시는 한 줄기 소나기', headlineSubtitle: '꼭 필요한 타이밍에 등장하는 해결사' },
  { dayMaster: '계(癸)', topElement: '금(金)', headlineTitle: '깊은 산속의 맑은 옹달샘', headlineSubtitle: '티 없이 맑은 영혼과 예리한 통찰력' },
  { dayMaster: '계(癸)', topElement: '수(水)', headlineTitle: '세상을 뒤덮고 쏟아지는 폭우', headlineSubtitle: '한 번 화나면 막을 수 없는 폭발적인 기세' },
]

const WEAPON_DB: WeaponRow[] = [
  { sipsung: '비견', text: "누구에게도 기대지 않고 험난한 세상에서 스스로 일어서는 '강력한 독립심과 주체성'" },
  { sipsung: '겁재', text: "치열한 경쟁 속에서 기어코 남을 꺾고 승리를 쟁취해 내는 '불굴의 투지와 승부욕'" },
  { sipsung: '식신', text: "멈추지 않는 아이디어와 전문 기술로 무에서 유를 창조하는 '뛰어난 기획력'" },
  { sipsung: '상관', text: "남의 마음을 훔치는 탁월한 언변과 고정관념의 틀을 깨버리는 '날카로운 혁신성'" },
  { sipsung: '정재', text: "1원도 허투루 쓰지 않는 꼼꼼함과 차곡차곡 결과를 만들어내는 '완벽한 현실 감각'" },
  { sipsung: '편재', text: "스케일이 다른 결단력과 돈의 흐름을 본능적으로 읽어내는 '탁월한 재물 감각'" },
  { sipsung: '정관', text: "원칙을 지키며 조직에서 신뢰를 쌓아 끝내 높은 자리에 오르는 '바른 리더십'" },
  { sipsung: '편관', text: "어떤 시련과 압박이 와도 포기하지 않고 미션을 완수해 내는 '집념의 책임감'" },
  { sipsung: '정인', text: "스펀지처럼 지식을 흡수하고 주변의 귀인들을 끌어당기는 '깊은 수용력과 인복'" },
  { sipsung: '편인', text: "남들이 보지 못하는 이면을 꿰뚫어 보고 눈치 빠르게 대처하는 '천재적인 직관력'" },
]

const OHANG_WEAPON_DB: OhangWeaponRow[] = [
  { ohang: '목', text: "무에서 유를 창조하며 끊임없이 성장하고 뻗어나가는 '탁월한 개척정신과 추진력'" },
  { ohang: '화', text: "어둠을 밝히는 태양처럼 사람들을 매료시키고 이끄는 '폭발적인 열정과 화려한 표현력'" },
  { ohang: '토', text: "어떤 위기에서도 중심을 잃지 않고 만물을 아우르는 '태산 같은 안정감과 두터운 신뢰'" },
  { ohang: '금', text: "복잡한 상황을 예리하게 분석하고 맺고 끊음이 확실한 '냉철한 판단력과 완벽주의'" },
  { ohang: '수', text: "어떤 환경에도 유연하게 스며들며 판을 꿰뚫어 보는 '깊은 지혜와 뛰어난 처세술'" },
]

const ACHILLES_DB: AchillesRow[] = [
  { condition: '목(木) 과다', achillesIntro: '나무(木)의 기운이 너무 빽빽하여 사방이 막혀 있습니다.', achillesText: '고집이 너무 세서 타인의 조언을 듣지 않아 다 된 일을 스스로 망치기 쉽습니다.' },
  { condition: '목(木) 결핍', achillesIntro: '새로운 시작을 돕는 나무(木)의 생명력이 부족합니다.', achillesText: '추진력이 부족해 좋은 기회가 눈앞에 있어도 망설이다 놓치기 쉽습니다.' },
  { condition: '화(火) 과다', achillesIntro: '불(火)의 기운이 용광로처럼 너무 뜨겁게 끓어오르고 있습니다.', achillesText: '욱하는 폭발적인 성격 때문에 한순간의 말실수로 사람을 잃고 후회합니다.' },
  { condition: '화(火) 결핍', achillesIntro: '세상을 밝히는 불(火)의 에너지가 꺼져 있습니다.', achillesText: '열정과 표현력이 부족해, 노력에 비해 성과가 겉으로 잘 드러나지 않습니다.' },
  { condition: '토(土) 과다', achillesIntro: '흙(土)이 너무 무거워 변화의 흐름이 멈춰 있습니다.', achillesText: '융통성이 부족하고 고지식하다는 소리를 자주 들으며 변화에 뒤처질 수 있습니다.' },
  { condition: '토(土) 결핍', achillesIntro: '나를 지탱해 줄 단단한 땅(土)의 기운이 부족합니다.', achillesText: '삶의 안정감이 떨어져 한곳에 정착하지 못하고 마음이 늘 붕 떠 있습니다.' },
  { condition: '금(金) 과다', achillesIntro: '날카로운 금속(金)의 기운이 사방을 찌르고 있습니다.', achillesText: '성격이 너무 예민하고 칼 같아서 주변 사람들에게 상처를 주고 스스로 외로워집니다.' },
  { condition: '금(金) 결핍', achillesIntro: '맺고 끊는 금속(金)의 결단력이 보이지 않습니다.', achillesText: '우유부단함 때문에 손해를 보고도 끊어내지 못해 흑역사를 반복하기 쉽습니다.' },
  { condition: '수(水) 과다', achillesIntro: '물(水)의 기운이 너무 깊어 바닥이 보이지 않습니다.', achillesText: '생각이 너무 깊고 우울감에 잘 빠지며, 행동보다 고민만 하다가 시간을 보냅니다.' },
  { condition: '수(水) 결핍', achillesIntro: '상황을 유연하게 돌리는 물(水)의 기운이 메말라 있습니다.', achillesText: '임기응변이 부족하여 예상치 못한 위기가 닥쳤을 때 크게 당황합니다.' },
  { condition: '비겁 과다', achillesIntro: '주변에 내 것을 노리는 기운이 너무 강합니다.', achillesText: '내 것을 남에게 빼앗기는 기운이 있어 동업과 금전 거래는 절대 피해야 합니다.' },
  { condition: '무비겁(0점)', achillesIntro: '나를 지지해 줄 내 편의 기운이 보이지 않습니다.', achillesText: '경쟁 상황에서 쉽게 위축되고, 주변에 진심으로 기댈 사람이 부족하다 느낍니다.' },
  { condition: '식상 과다', achillesIntro: '밖으로 뿜어내는 에너지가 조절되지 않고 있습니다.', achillesText: '말과 행동이 앞서 구설수에 자주 오르며 뒷심이 부족해 용두사미가 되기 쉽습니다.' },
  { condition: '무식상(0점)', achillesIntro: '내 안의 것을 밖으로 표현하는 통로가 막혀 있습니다.', achillesText: '애교와 표현력이 부족해 연애가 서툴고, 자신의 실력을 어필하는 데 어려움을 겪습니다.' },
  { condition: '재성 과다', achillesIntro: '재물에 대한 욕심이 통제 범위를 넘어섰습니다.', achillesText: '돈에 대한 집착이 오히려 판단을 흐리게 하여 무리한 투자로 큰 재물을 잃을 수 있습니다.' },
  { condition: '무재성(0점)', achillesIntro: '결과를 매듭짓는 현실적인 감각이 부족합니다.', achillesText: '돈을 벌어도 관리가 되지 않아 금방 새어나가며, 마무리가 늘 약한 모습입니다.' },
  { condition: '관성 과다', achillesIntro: '나를 옥죄는 규칙과 책임의 무게가 너무 무겁습니다.', achillesText: '타인의 시선을 너무 의식하고 완벽주의 강박 때문에 스스로를 병들게 합니다.' },
  { condition: '무관성(0점)', achillesIntro: "나를 통제하는 브레이크인 '관성'의 기운이 텅 비어 있습니다.", achillesText: '조직의 통제를 견디지 못해 직장 생활에서 마찰이 잦고 퇴사를 반복하기 쉽습니다.' },
  { condition: '인성 과다', achillesIntro: '수용하는 기운이 넘쳐 실행력이 마비되었습니다.', achillesText: '게으름과 잡생각이 많고 타인에게 의존하려는 성향이 강해지기 쉽습니다.' },
  { condition: '무인성(0점)', achillesIntro: '윗사람의 혜택이나 인복의 기운이 약합니다.', achillesText: '남의 도움 없이 오직 내 노력만으로 결과를 내야 해서 인생이 고달프다 느낍니다.' },
]

const MISSION_DB: MissionRow[] = [
  { mainStar: '비견', missionKeyword: '자립과 주체성', missionText: '남의 눈치를 보지 않고 내 소신대로 밀어붙일 때 인생의 모든 문이 열립니다.' },
  { mainStar: '겁재', missionKeyword: '경쟁과 승부', missionText: '치열한 승부의 세계에서 내 것을 쟁취할 때 비로소 살아있음을 느끼고 크게 성공합니다.' },
  { mainStar: '식신', missionKeyword: '전문 기술과 생산', missionText: '남들이 따라 할 수 없는 나만의 기술로 평생 마르지 않는 곳간을 채우는 삶입니다.' },
  { mainStar: '상관', missionKeyword: '혁신과 매혹', missionText: '답답한 틀을 깨고 나의 재능으로 사람들의 마음을 훔치는 것이 당신의 숙명입니다.' },
  { mainStar: '정재', missionKeyword: '안정적인 자산 형성', missionText: '땀 흘려 모은 돈으로 굳건한 성을 쌓아가는 성실한 부자의 정석을 보여주게 됩니다.' },
  { mainStar: '편재', missionKeyword: '큰 재물과 투자', missionText: '작은 돈에 연연하지 말고 시장의 큰 흐름을 읽어 거대한 부를 거머쥐어야 합니다.' },
  { mainStar: '정관', missionKeyword: '명예와 조직 리더십', missionText: '조직 내에서 원칙을 지키며 존경받는 리더로 이름을 날리는 것이 최고의 가치입니다.' },
  { mainStar: '편관', missionKeyword: '난관 극복과 카리스마', missionText: '평범한 삶 대신 거친 파도를 잠재우는 강력한 리더로 군림할 때 비로소 빛이 납니다.' },
  { mainStar: '정인', missionKeyword: '학문과 자격', missionText: '끊임없는 배움을 통해 나만의 지적 자산을 완성하고 우아하게 살아가는 흐름입니다.' },
  { mainStar: '편인', missionKeyword: '특수 분야의 장인', missionText: '평범한 길 대신 나만의 독특한 정신세계나 특수 기술로 독보적인 위치에 오르게 됩니다.' },
]

function normalizeUserName(name: string) {
  const trimmed = name.trim() || '회원'
  return trimmed.endsWith('님') ? trimmed.slice(0, -1) : trimmed
}

function normalizeDayMaster(raw: string): DayMaster | undefined {
  const normalized = raw.trim()
  return DAY_MASTER_ALIAS_MAP[normalized]
}

function pickHeadline(userData: ReportUserData): HeadlineRow {
  const dayMaster = normalizeDayMaster(userData.ilgan)
  const topElement = OHANG_TO_TOP_ELEMENT[userData.dominantOhang]

  return (
    HEADLINE_DB.find((row) => row.dayMaster === dayMaster && row.topElement === topElement) ??
    HEADLINE_DB.find((row) => row.dayMaster === dayMaster) ??
    HEADLINE_DB.find((row) => row.topElement === topElement) ??
    HEADLINE_DB[0]
  )
}

function pickSipsungWeaponText(sipsung: Sipsung) {
  return WEAPON_DB.find((row) => row.sipsung === sipsung)?.text ?? "상황을 읽고 해법을 만드는 '문제 해결력'"
}

function pickOhangWeaponText(ohang: Ohang) {
  return OHANG_WEAPON_DB.find((row) => row.ohang === ohang)?.text ?? "흐름을 읽고 리듬을 맞추는 '균형 감각'"
}

function pickOhangAchilles(userData: ReportUserData): AchillesRow | null {
  const deficientTarget = userData.deficientOhang[0]
  if (deficientTarget) {
    const condition = `${OHANG_TO_TOP_ELEMENT[deficientTarget]} 결핍`
    const row = ACHILLES_DB.find((item) => item.condition === condition)
    if (row) return row
  }

  const excessiveTarget = userData.excessiveOhang[0]
  if (excessiveTarget) {
    const condition = `${OHANG_TO_TOP_ELEMENT[excessiveTarget]} 과다`
    const row = ACHILLES_DB.find((item) => item.condition === condition)
    if (row) return row
  }

  return null
}

function pickSipsungAchilles(userData: ReportUserData): AchillesRow | null {
  const deficientSipsungGroup = userData.deficientSipsungGroups[0]
  if (deficientSipsungGroup) {
    const row = ACHILLES_DB.find((item) => item.condition === `무${deficientSipsungGroup}(0점)`)
    if (row) return row
  }

  const excessiveSipsungGroup = userData.excessiveSipsungGroups[0]
  if (excessiveSipsungGroup) {
    const row = ACHILLES_DB.find((item) => item.condition === `${excessiveSipsungGroup} 과다`)
    if (row) return row
  }

  return null
}

function pickAchilles(userData: ReportUserData) {
  const ohangAchilles = pickOhangAchilles(userData)
  const sipsungAchilles = pickSipsungAchilles(userData)

  if (ohangAchilles && sipsungAchilles) {
    return {
      achillesIntro: `${ohangAchilles.achillesIntro} 동시에 ${sipsungAchilles.achillesIntro}`,
      achillesText: `${ohangAchilles.achillesText} 또한 ${sipsungAchilles.achillesText}`,
    }
  }

  if (ohangAchilles) {
    return {
      achillesIntro: ohangAchilles.achillesIntro,
      achillesText: ohangAchilles.achillesText,
    }
  }

  if (sipsungAchilles) {
    return {
      achillesIntro: sipsungAchilles.achillesIntro,
      achillesText: sipsungAchilles.achillesText,
    }
  }

  return {
    achillesIntro: '극단적인 결핍/과다는 없지만 균형이 쉽게 흔들릴 수 있는 지점이 보입니다',
    achillesText: '균형을 잃지 않도록 생활 리듬과 감정 소모를 꾸준히 관리하면 안정감이 훨씬 좋아집니다.',
  }
}

function pickMission(userData: ReportUserData): MissionRow {
  return MISSION_DB.find((row) => row.mainStar === userData.topSipsung) ?? MISSION_DB[0]
}

function generateReportLegacy(userData: ReportUserData) {
  const normalizedUserName = normalizeUserName(userData.userName)
  const weapon1Text = pickSipsungWeaponText(userData.topSipsung)
  const weapon2Text = pickOhangWeaponText(userData.dominantOhang)
  const { achillesIntro, achillesText } = pickAchilles(userData)
  const mission = pickMission(userData)

  return `🗡️ 나의 강력한 무기
${normalizedUserName}님이 살아가며 남들보다 유리하게 휘두를 수 있는 가장 강력한 무기는 '${weapon1Text}'과 '${weapon2Text}'입니다. 이 두 가지 기운이 결합되어 남들이 보지 못하는 틈새시장에서 기회를 찾아내는 데 천부적인 재능을 발휘합니다.

🚨 치명적인 아킬레스건
하지만 주의하세요. ${normalizedUserName}님의 사주에는 ${achillesIntro}. ${achillesText} 자유를 얻으려면 그만큼 스스로에 대한 엄격한 책임감이 필요합니다.

🚩 평생의 핵심 미션
따라서 ${normalizedUserName}님의 인생 전반을 관통하는 핵심 키워드는 '${mission.missionKeyword}'입니다. ${mission.missionText}`
}

function stripSquareBrackets(value: string) {
  return value.replace(/\[/g, '').replace(/\]/g, '')
}

function generateReportLegacyBroken(userData: ReportUserData) {
  const normalizedUserName = normalizeUserName(userData.userName)
  const weapon1Text = stripSquareBrackets(pickSipsungWeaponText(userData.topSipsung))
  const weapon2Text = stripSquareBrackets(pickOhangWeaponText(userData.dominantOhang))
  const { achillesIntro, achillesText } = pickAchilles(userData)
  const mission = pickMission(userData)

  const report = `🗡️ 나의 강력한 무기
${normalizedUserName}님이 살아가며 남들보다 유리하게 휘두를 수 있는 가장 강력한 무기는 '${weapon1Text}'과 '${weapon2Text}'입니다. 이 두 가지 기운이 결합되어 남들이 보지 못하는 틈새시장에서 기회를 찾아내는 데 천부적인 재능을 발휘합니다.

🚨 치명적인 아킬레스건
하지만 주의하세요. ${normalizedUserName}님의 사주에는 ${achillesIntro}. ${achillesText} 자유를 얻으려면 그만큼 스스로에 대한 엄격한 책임감이 필요합니다.

🚩 평생의 핵심 미션
따라서 ${normalizedUserName}님의 인생 전반을 관통하는 핵심 키워드는 '${stripSquareBrackets(mission.missionKeyword)}'입니다. ${stripSquareBrackets(mission.missionText)}`

  return stripSquareBrackets(report)
}

export function generateReport(userData: ReportUserData) {
  const normalizedUserName = normalizeUserName(userData.userName)
  const headline = pickHeadline(userData)
  const weapon1Text = stripSquareBrackets(pickSipsungWeaponText(userData.topSipsung))
  const weapon2Text = stripSquareBrackets(pickOhangWeaponText(userData.dominantOhang))
  const { achillesIntro, achillesText } = pickAchilles(userData)
  const mission = pickMission(userData)

  const report = `'${stripSquareBrackets(headline.headlineSubtitle)}'

'🗡️ 나의 강력한 무기'
${normalizedUserName}님이 살아가며 남들보다 유리하게 휘두를 수 있는 가장 강력한 무기는 ${weapon1Text}과 ${weapon2Text}입니다. 이 두 가지 기운이 결합되어 남들이 보지 못하는 틈새시장에서 기회를 찾아내는 데 천부적인 재능을 발휘합니다.

'🚨 치명적인 아킬레스건'
하지만 주의하세요. ${normalizedUserName}님의 사주에는 ${stripSquareBrackets(achillesIntro)}. ${stripSquareBrackets(achillesText)} 자유를 얻으려면 그만큼 스스로에 대한 엄격한 책임감이 필요합니다.

'🚩 평생의 핵심 미션'
따라서 ${normalizedUserName}님의 인생 전반을 관통하는 핵심 키워드는 '${stripSquareBrackets(mission.missionKeyword)}'입니다. ${stripSquareBrackets(mission.missionText)}`

  return stripSquareBrackets(report)
}
