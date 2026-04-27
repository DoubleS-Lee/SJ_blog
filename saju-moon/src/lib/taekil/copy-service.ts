import type { SelectionPurpose } from '@/lib/saju/date-selection'
import { fetchTaekilCopyRowsFromDb } from './copy-repository'
import {
  TAEKIL_LOCAL_COPY,
  type TaekilLevel,
  type TaekilUiCopyBundle,
} from './copy-data'

function cloneLocalCopy(): TaekilUiCopyBundle {
  return {
    page: { ...TAEKIL_LOCAL_COPY.page },
    purposes: {
      romance: { ...TAEKIL_LOCAL_COPY.purposes.romance },
      marriage: { ...TAEKIL_LOCAL_COPY.purposes.marriage },
      moving: { ...TAEKIL_LOCAL_COPY.purposes.moving },
      opening: { ...TAEKIL_LOCAL_COPY.purposes.opening },
      contract: { ...TAEKIL_LOCAL_COPY.purposes.contract },
      interview: { ...TAEKIL_LOCAL_COPY.purposes.interview },
      treatment: { ...TAEKIL_LOCAL_COPY.purposes.treatment },
      travel: { ...TAEKIL_LOCAL_COPY.purposes.travel },
    },
    levels: {
      best: { ...TAEKIL_LOCAL_COPY.levels.best },
      good: { ...TAEKIL_LOCAL_COPY.levels.good },
      normal: { ...TAEKIL_LOCAL_COPY.levels.normal },
      caution: { ...TAEKIL_LOCAL_COPY.levels.caution },
      avoid: { ...TAEKIL_LOCAL_COPY.levels.avoid },
    },
    panels: { ...TAEKIL_LOCAL_COPY.panels },
    templates: { ...TAEKIL_LOCAL_COPY.templates },
    weekdays: [...TAEKIL_LOCAL_COPY.weekdays],
  }
}

export async function buildTaekilUiCopyWithDb() {
  const copy = cloneLocalCopy()
  const rows = await fetchTaekilCopyRowsFromDb()

  for (const row of rows) {
    if (row.copy_group === 'purpose') {
      const purpose = row.copy_key as SelectionPurpose
      if (!copy.purposes[purpose]) continue

      copy.purposes[purpose] = {
        label: row.title || copy.purposes[purpose].label,
        shortLabel: row.summary || copy.purposes[purpose].shortLabel,
        description: row.detail || copy.purposes[purpose].description,
      }
      continue
    }

    if (row.copy_group === 'level') {
      const level = row.copy_key as TaekilLevel
      if (!copy.levels[level]) continue

      copy.levels[level] = {
        publicLabel: row.title || copy.levels[level].publicLabel,
        compactLabel: row.summary || copy.levels[level].compactLabel,
      }
      continue
    }

    if (row.copy_group === 'page') {
      switch (row.copy_key) {
        case 'guest_hero':
          copy.page.guestTitle = row.title || copy.page.guestTitle
          copy.page.guestDescription = row.summary || copy.page.guestDescription
          break
        case 'guest_primary_cta':
          copy.page.guestPrimaryCta = row.title || copy.page.guestPrimaryCta
          break
        case 'guest_secondary_cta':
          copy.page.guestSecondaryCta = row.title || copy.page.guestSecondaryCta
          break
        case 'no_saju_hero':
          copy.page.noSajuTitle = row.title || copy.page.noSajuTitle
          copy.page.noSajuDescription = row.summary || copy.page.noSajuDescription
          break
        case 'no_saju_primary_cta':
          copy.page.noSajuPrimaryCta = row.title || copy.page.noSajuPrimaryCta
          break
        case 'no_saju_secondary_cta':
          copy.page.noSajuSecondaryCta = row.title || copy.page.noSajuSecondaryCta
          break
        case 'main_hero':
          copy.page.mainTitle = row.title || copy.page.mainTitle
          copy.page.mainDescription = row.summary || copy.page.mainDescription
          break
        case 'purpose_section':
          copy.page.purposeSectionTitle = row.title || copy.page.purposeSectionTitle
          copy.page.purposeSectionDescription = row.summary || copy.page.purposeSectionDescription
          break
        case 'calendar_navigation':
          copy.page.previousMonthLabel = row.title || copy.page.previousMonthLabel
          copy.page.nextMonthLabel = row.summary || copy.page.nextMonthLabel
          copy.page.calendarSubtitle = row.detail || copy.page.calendarSubtitle
          break
        case 'selected_meta':
          copy.page.selectedEyebrow = row.title || copy.page.selectedEyebrow
          copy.page.lunarPrefix = row.summary || copy.page.lunarPrefix
          break
        default:
          break
      }
      continue
    }

    if (row.copy_group === 'panel') {
      switch (row.copy_key) {
        case 'avoid_title':
          copy.panels.avoidTitle = row.title || copy.panels.avoidTitle
          break
        case 'avoid_fallback':
          copy.panels.avoidFallback = row.title || copy.panels.avoidFallback
          break
        case 'caution_title':
          copy.panels.cautionTitle = row.title || copy.panels.cautionTitle
          break
        case 'caution_fallback':
          copy.panels.cautionFallback = row.title || copy.panels.cautionFallback
          break
        case 'normal_title':
          copy.panels.normalTitle = row.title || copy.panels.normalTitle
          break
        case 'normal_fallback':
          copy.panels.normalFallback = row.title || copy.panels.normalFallback
          break
        case 'note_title':
          copy.panels.noteTitle = row.title || copy.panels.noteTitle
          break
        case 'recommended_title':
          copy.panels.recommendedTitle = row.title || copy.panels.recommendedTitle
          break
        case 'best_dates_title':
          copy.panels.bestDatesTitle = row.title || copy.panels.bestDatesTitle
          break
        case 'best_dates_empty':
          copy.panels.bestDatesEmpty = row.title || copy.panels.bestDatesEmpty
          break
        default:
          break
      }
    }

    if (row.copy_group === 'template') {
      const templateKey = row.copy_key as keyof typeof copy.templates
      if (templateKey in copy.templates) {
        copy.templates[templateKey] = row.title || copy.templates[templateKey]
      }
    }
  }

  return copy
}
