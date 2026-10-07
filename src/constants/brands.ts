import aaLogo from '@/assets/brands/aa.svg';
import hjhLogo from '@/assets/brands/hjh.svg';
import huangshanghuangLogo from '@/assets/brands/huangshanghuang.svg';
import kfcLogo from '@/assets/brands/kfc.svg';
import lavazzaLogo from '@/assets/brands/lavazza.svg';
import lsLogo from '@/assets/brands/ls.svg';
import phLogo from '@/assets/brands/ph.svg';
import sandboxLogo from '@/assets/brands/sandbox.svg';
import tacoLogo from '@/assets/brands/taco.svg';
import yumcLogo from '@/assets/brands/yumc.svg';

export interface Brand {
  /** 唯一标识，用于记录当前选择；修改名称时请保持 id 不变。 */
  id: string;
  name: string;
  logo?: string;
}

/** 品牌列表：本地 Logo 从 assets 导入，也支持图片 URL；首项为默认品牌。 */
export const brands: readonly [Brand, ...Brand[]] = [
  { id: 'kfc', name: 'KFC', logo: kfcLogo },
  { id: 'ph', name: 'PH', logo: phLogo },
  { id: 'yumc', name: 'YUMC', logo: yumcLogo },
  { id: 'taco', name: 'TACO', logo: tacoLogo },
  { id: 'lavazza', name: 'LAVAZZA', logo: lavazzaLogo },
  { id: 'ls', name: 'LS', logo: lsLogo },
  { id: 'hjh', name: 'HJH', logo: hjhLogo },
  {
    id: 'huangshanghuang',
    name: '煌上煌',
    logo: huangshanghuangLogo,
  },
  { id: 'sandbox', name: '沙盒', logo: sandboxLogo },
  { id: 'aa', name: 'AA', logo: aaLogo },
];
