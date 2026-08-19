/**
 * 项目数据字典
 * -----------------------------
 * 所有 GitHub 项目统一在此维护，新增项目只需 push 一条对象即可。
 *
 * 字段说明：
 *  - name      仓库名（显示用）
 *  - url       跳转地址
 *  - desc      简短描述
 *  - lang      主要编程语言（可选）
 *  - stars     star 数（可选），无则不展示
 *  - tags      项目标签（可选）
 */

export interface Project {
  name: string;
  url: string;
  desc: string;
  lang?: string;
  stars?: number;
  tags?: string[];
}

export const projects: Project[] = [
  {
    name: 'project-demo',
    url: 'https://sanshuibot.github.io/project-demo/confession/index.html',
    desc: '爱心树',
    lang: 'JavaScript',
    tags: ['JavaScript', 'HTML', 'CSS'],
  },
  {
    name: 'project-demo',
    url: 'https://sanshuibot.github.io/project-demo/minions/minions_animation.html',
    desc: '小黄人构造器',
    lang: 'CSS3',
    tags: ['CSS3', 'HTML'],
  },
  {
    name: 'project-demo',
    url: 'https://sanshuibot.github.io/project-demo/3DPeriodicTable/index.html',
    desc: '3D元素周期表',
    lang: 'JavaScript',
    tags: ['Three.js'],
  },
];
