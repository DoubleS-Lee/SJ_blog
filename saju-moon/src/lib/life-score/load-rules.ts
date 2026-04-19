import type {
  AgeActivationRules,
  DomainWeightsRules,
  InteractionRules,
  JohooRules,
  LifeScoreRulesBundle,
  StarStrengthRules,
  TransitionRules,
  YongheegiRules,
} from './schema'

import ageActivationRulesJson from './rules/age-activation-rules.json'
import domainWeightsJson from './rules/domain-weights.json'
import interactionRulesJson from './rules/interaction-rules.json'
import johooRulesJson from './rules/johoo-rules.json'
import starStrengthRulesJson from './rules/star-strength-rules.json'
import transitionRulesJson from './rules/transition-rules.json'
import yongheegiRulesJson from './rules/yongheegi-rules.json'

export function loadLifeScoreRules(): LifeScoreRulesBundle {
  return {
    ageActivationRules: ageActivationRulesJson as AgeActivationRules,
    domainWeights: domainWeightsJson as DomainWeightsRules,
    starStrengthRules: starStrengthRulesJson as StarStrengthRules,
    interactionRules: interactionRulesJson as InteractionRules,
    transitionRules: transitionRulesJson as TransitionRules,
    johooRules: johooRulesJson as JohooRules,
    yongheegiRules: yongheegiRulesJson as YongheegiRules,
  }
}
