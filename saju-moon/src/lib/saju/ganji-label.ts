const CHEONGAN_READING: Record<string, string> = {
  甲: '갑',
  乙: '을',
  丙: '병',
  丁: '정',
  戊: '무',
  己: '기',
  庚: '경',
  辛: '신',
  壬: '임',
  癸: '계',
}

const JIJI_READING: Record<string, string> = {
  子: '자',
  丑: '축',
  寅: '인',
  卯: '묘',
  辰: '진',
  巳: '사',
  午: '오',
  未: '미',
  申: '신',
  酉: '유',
  戌: '술',
  亥: '해',
}

const HANJA_READING: Record<string, string> = {
  宜: '의',
  忌: '기',
  青龙: '청룡',
  明堂: '명당',
  天刑: '천형',
  朱雀: '주작',
  金匮: '금궤',
  天德: '천덕',
  白虎: '백호',
  玉堂: '옥당',
  天牢: '천로',
  玄武: '현무',
  司命: '사명',
  勾陈: '구진',
}

export function formatGanjiWithReading(ganji: string) {
  const [cheongan = '', jiji = ''] = Array.from(ganji)
  const cheonganReading = CHEONGAN_READING[cheongan] ?? ''
  const jijiReading = JIJI_READING[jiji] ?? ''

  if (cheonganReading && jijiReading) {
    return `${ganji}(${cheonganReading}${jijiReading})`
  }

  return ganji
}

export function formatHanjaWithReading(value: string) {
  const reading = HANJA_READING[value]
  return reading ? `${value}(${reading})` : value
}
