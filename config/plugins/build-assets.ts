import { type IApi } from '@umijs/max';

export default function buildAssets(api: IApi) {
  api.modifyHTML(($) => {
    if (api.env !== 'production') {
      return $;
    }

    // Umi 按 umi.js 识别入口；自定义 js/ 路径后，将入口及依赖保持在 root 后执行。
    const prefix = `${api.config.publicPath || '/'}js/`;
    $('head script[src]').each((_, element) => {
      const script = $(element);
      const src = script.attr('src') || '';
      if (src.startsWith(prefix) && /\.[a-f0-9]{8}(?:\.async)?\.js$/.test(src)) {
        $('body').append(script);
      }
    });
    return $;
  });
}
