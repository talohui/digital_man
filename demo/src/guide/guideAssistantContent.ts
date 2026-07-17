import { getLingshanPoiDetailById } from '../data/lingshanPoiDetails'
import {
  getPoiGuideDisplayName,
  getRecommendedStayLabel
} from '../data/poiGuideMetadata'
import { getScenicRouteById } from '../data/lingshanScenicRoutes'
import type { GuideContext } from './GuideMessageSchema'

export type GuideAssistantContent = {
  title: string
  subtitle: string
  greeting: string
  suggestedQuestions: string[]
}

const routeContent: Record<string, { theme: string; questions: string[] }> = {
  historical_culture: {
    theme: '佛教历史、古刹建筑与艺术空间',
    questions: ['这条路线适合我吗？', '会经过哪些重点景点？', '如何安排游览节奏？']
  },
  natural_scenery: {
    theme: '太湖风光、园林景观与禅意漫游',
    questions: ['哪里最适合看太湖？', '沿途有哪些园林景观？', '这条路线适合拍日落吗？']
  },
  family: {
    theme: '轻松步行、亲子互动与趣味体验',
    questions: ['带孩子适合从哪一站开始？', '哪些点位互动性更强？', '路线需要预留多久？']
  }
}

function getRouteContent(routeId?: string) {
  return routeId ? routeContent[routeId] : undefined
}

function getPoiQuestions(poiId: string | undefined, poiName: string) {
  const questionsByPoiId: Record<string, string[]> = {
    jiulong_guanyu: ['九龙灌浴讲的是什么故事？', '什么时候看演绎更合适？', '站在哪里观看和拍照更好？'],
    xiangfu_temple: ['祥符禅寺有什么看点？', '建筑格局有什么讲究？', '礼佛游览应该注意什么？'],
    giant_buddha: ['灵山大佛的手印有什么寓意？', '登云道怎么安排更合适？', '从哪里拍大佛视野更好？'],
    fan_gong: ['梵宫里最值得看的艺术细节是什么？', '参观梵宫建议停留多久？', '室内游览要注意什么？'],
    wuyin_tancheng: ['五印坛城有哪些建筑看点？', '转经廊游览有什么礼仪？', '哪里适合看坛城全景？']
  }

  return questionsByPoiId[poiId ?? ''] ?? [
    `${poiName}最值得看的是什么？`,
    `${poiName}建议停留多久？`,
    `${poiName}适合在哪里拍照？`
  ]
}

export function resolveGuideAssistantContent(context: GuideContext): GuideAssistantContent {
  if (context.page === 'poi') {
    const poiId = context.selectedPoiId
    const detail = getLingshanPoiDetailById(poiId)
    const poiName = context.selectedPoiName ?? detail?.name ?? getPoiGuideDisplayName(poiId) ?? '当前景点'
    const subtitle = detail?.subtitle ?? getRecommendedStayLabel(poiId)
    return {
      title: `了解${poiName}`,
      subtitle,
      greeting: `我是小灵。现在带你了解${poiName}，可以问故事、看点、拍照位置或游览建议。`,
      suggestedQuestions: getPoiQuestions(poiId, poiName)
    }
  }

  if (context.page === 'route') {
    const route = getScenicRouteById(context.routeId)
    const routeName = route?.name ?? context.routeName ?? '当前路线'
    const routeGuide = getRouteContent(context.routeId)
    const routeTheme = routeGuide?.theme ?? route?.description ?? '景区导览'
    const currentName = context.currentStopName ?? getPoiGuideDisplayName(context.currentStopPoiId)
    const nextName = context.nextStopName ?? getPoiGuideDisplayName(context.nextStopPoiId)

    if (context.stage === 'arrived') {
      const poiName = currentName ?? '当前景点'
      return {
        title: `已到达：${poiName}`,
        subtitle: `${routeName} · ${getRecommendedStayLabel(context.currentStopPoiId)}`,
        greeting: `你已到达${poiName}。可以先了解这一站的重点，也可以问我下一站怎么走。`,
        suggestedQuestions: [
          `介绍一下${poiName}`,
          nextName ? `下一站${nextName}怎么走？` : '下一站怎么走？',
          '这里适合拍照吗？'
        ]
      }
    }

    if (context.stage === 'active') {
      return {
        title: `正在游览：${routeName}`,
        subtitle: nextName ? `下一站：${nextName} · ${getRecommendedStayLabel(context.nextStopPoiId)}` : routeTheme,
        greeting: nextName
          ? `正在前往${nextName}。我可以先讲这一站的看点，也可以帮你查看接下来的路线节奏。`
          : `正在游览${routeName}，我会陪你关注沿途看点和游览节奏。`,
        suggestedQuestions: [
          nextName ? `讲讲下一站${nextName}` : '讲讲下一站',
          '我还剩多少站？',
          '附近有休息点吗？'
        ]
      }
    }

    if (context.stage === 'joining') {
      return {
        title: `准备游览：${routeName}`,
        subtitle: `${routeTheme}${currentName ? ` · 从${currentName}开始` : ''}`,
        greeting: `这条路线以${routeTheme}为主。准备好后，我们可以从当前选择的站点开始。`,
        suggestedQuestions: [
          '从哪里开始更合适？',
          currentName ? `${currentName}有什么看点？` : '第一站有什么看点？',
          '这条路线需要多长时间？'
        ]
      }
    }

    return {
      title: `路线预览：${routeName}`,
      subtitle: `${route?.guideRoute.durationLabel ?? ''}${route?.stops.length ? ` · ${route.stops.length}个景点` : ''}${routeTheme ? ` · ${routeTheme}` : ''}`,
      greeting: `这条路线适合关注${routeTheme}。你可以先浏览站点，再决定何时开始游览。`,
      suggestedQuestions: routeGuide?.questions ?? ['这条路线适合我吗？', '会经过哪些景点？', '如何安排游览节奏？']
    }
  }

  return {
    title: '小灵导览',
    subtitle: '灵山胜境自由探索',
    greeting: '我是小灵。想找路线、听景点故事、问服务点，都可以问我。',
    suggestedQuestions: ['我还有 1 小时怎么逛？', '最近的厕所在哪？', '这附近有什么好拍的？']
  }
}
