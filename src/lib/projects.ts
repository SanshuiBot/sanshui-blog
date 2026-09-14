/**
 * 项目数据字典
 * -----------------------------
 * 所有 GitHub 项目统一在此维护，新增项目只需 push 一条对象即可。
 *
 * 字段说明：
 *  - name      仓库名（显示用）
 *  - url       跳转地址
 *  - desc      简短描述
 *  - lang      主要技术栈（数组，可选），无则不展示
 *  - stars     star 数（可选），无则不展示
 *  - tags      项目标签（可选）
 */

export interface Project {
  name: string;
  url: string;
  desc: string;
  lang?: string[];
  stars?: number;
  tags?: string[];
}

export const projects: Project[] = [
  {
    name: '爱心树表白',
    url: 'https://SanshuiBot.github.io/project-demo/love-tree/index.html',
    desc: '点击心形种子，看它坠落入土、长成参天大树、开出满树繁花；打字机逐字敲出情话，倒计时默默记录「在一起」的每一天。',
    lang: ['Canvas 2D', '原生 JS'],
    tags: ['Canvas 动画', '打字机情书', '零依赖'],
  },
  {
    name: '纯 CSS3 小黄人',
    url: 'https://SanshuiBot.github.io/project-demo/css-minions/index.html',
    desc: '不用任何图片与脚本，仅用 DIV + CSS3 就画出会眨眼、嘴巴张合的小黄人军团，四种体型一次集齐。',
    lang: ['纯 CSS3', 'HTML'],
    tags: ['纯 CSS3 造型', '关键帧动画', '弹性布局'],
  },
  {
    name: '3D 元素周期表',
    url: 'https://SanshuiBot.github.io/project-demo/periodic-table-3d/index.html',
    desc: '118 个化学元素化作 3D 卡片，表格 / 球面 / 双螺旋 / 网格四种布局随意切换，拖拽旋转、滚轮缩放，身临其境「玩」周期表。',
    lang: ['Three.js', 'CSS3D', '原生 JS'],
    tags: ['three.js CSS3D', '布局切换', '补间动画'],
  },
];
