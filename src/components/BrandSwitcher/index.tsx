import { useState } from 'react';

import { DownOutlined } from '@ant-design/icons';
import { useDispatch, useSelector } from '@umijs/max';
import { Dropdown } from 'antd';

import { type Brand } from '@/constants/brands';
import { type BrandRootState } from '@/models/brand';

import styles from './index.less';

function BrandIcon({ brand }: { brand: Brand }) {
  const [failedLogo, setFailedLogo] = useState<string>();

  if (brand.logo && failedLogo !== brand.logo) {
    return (
      <img
        className={styles.logo}
        src={brand.logo}
        alt=""
        width={20}
        height={20}
        onError={() => setFailedLogo(brand.logo)}
      />
    );
  }

  return (
    <span className={styles.fallbackLogo} aria-hidden="true">
      {brand.name[0]}
    </span>
  );
}

export default function BrandSwitcher() {
  const { current: brand, list: brands } = useSelector((state: BrandRootState) => state.brand);
  const dispatch = useDispatch();

  return (
    <Dropdown
      trigger={['click']}
      menu={{
        selectable: true,
        selectedKeys: [brand.id],
        style: { minWidth: 144 },
        items: brands.map((item) => ({
          key: item.id,
          label: (
            <span className={styles.menuItem}>
              <BrandIcon brand={item} />
              <span>{item.name}</span>
            </span>
          ),
        })),
        onClick: ({ key }) => {
          const nextBrand = brands.find((item) => item.id === key);
          if (nextBrand && nextBrand.id !== brand.id) {
            dispatch({ type: 'brand/switchBrand', payload: nextBrand.id });
          }
        },
      }}
    >
      <button
        type="button"
        className={styles.button}
        aria-label={`切换品牌，当前品牌：${brand.name}`}
        title={brand.name}
      >
        {brand.logo && <BrandIcon brand={brand} />}
        <span className={styles.name}>{brand.name}</span>
        <DownOutlined className={styles.chevron} aria-hidden="true" />
      </button>
    </Dropdown>
  );
}
