import { Button, ConfigProvider, Empty, Flex, Progress } from 'antd';

import { buttonRadius } from '../appearance';
import styles from '../styles/StylePreview.less';

import type { SurveyAppearance } from '../appearance';
import type { SurveyContainer } from '../types';

interface Props {
  value: SurveyAppearance;
  containers: SurveyContainer[];
  title: string;
}

export default function StylePreview({ value, containers, title }: Props) {
  const content = containers.filter(
    (container) => container.kind === 'intro' || container.questions.length,
  );
  let questionNumber = 0;
  return (
    <section className={styles.stylePreview} aria-label="预览效果">
      <h3>预览效果</h3>
      <ConfigProvider
        theme={{
          token: {
            colorPrimary: value.themeColor,
            fontFamily: value.fontFamily,
            fontSize: value.fontSize,
            borderRadius: buttonRadius[value.buttonShape],
          },
        }}
      >
        <div
          className={`${styles.appearancePreviewCard} ${content.length === 0 ? styles.appearancePreviewEmpty : ''}`}
          style={{
            backgroundColor: value.backgroundColor,
            fontFamily: value.fontFamily,
            fontSize: value.fontSize,
          }}
        >
          {content.length === 0 ? (
            <Empty description="请先在内容页面添加题目" />
          ) : (
            <Flex vertical gap={20}>
              <h2>{title}</h2>
              {value.showProgress && (
                <Progress percent={0} showInfo={false} aria-label="问卷进度" />
              )}
              {content.map((container) => (
                <section key={container.id}>
                  <h3>{container.title}</h3>
                  {container.kind === 'intro' ? (
                    <p className={styles.previewIntroText}>{container.text}</p>
                  ) : (
                    container.questions.map((question) => (
                      <div key={question.id}>
                        <h4>
                          {value.showQuestionNumber ? `${++questionNumber}. ` : ''}
                          {question.title}
                        </h4>
                        {question.description && <p>{question.description}</p>}
                      </div>
                    ))
                  )}
                </section>
              ))}
              <Flex justify="center">
                <Button type="primary">下一页</Button>
              </Flex>
            </Flex>
          )}
        </div>
      </ConfigProvider>
    </section>
  );
}
