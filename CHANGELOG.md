# 📝 Change Log (변경 이력 기록)

## [260623-14:00] - 이지 가이드 노드 추가 및 UI 버그 수정
- **신규 (New)**
  - `EasyGuideMaker` 노드 추가: 워크플로우 내 노드들의 초기 세팅 저장, 초기화 기능, 메모 및 다운로드 링크 입력 기능 제공
  - `EasyGuideViewer` 노드 추가: 연결된 Maker 노드의 실시간 설정값 가이드 데이터 뷰어 기능 제공
- **오류 수정 (Fix)**
  - 가이드 데이터(`guide_data`) JSON 텍스트가 노드 배경에 누적되어 출력되는 잔상 문제 해결 (위젯 타입을 `CONVERTED-widget`으로 우회하고 draw/computeSize 함수 오버라이드로 숨김 처리)
  - DOM UI 위젯이 노드의 경계를 뚫고 나오는 레이아웃 오버플로우 문제 수정 (CSS 및 JS absolute 스타일 조정)
- **개선 (Improvement)**
  - CSS UI 테마를 Sleek Dark Modern 스타일로 개선 및 뷰어 미리보기 모달 UI 추가
