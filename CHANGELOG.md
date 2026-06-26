# 📝 Change Log (변경 이력 기록)

## [260626-15:20] - Random LoRA Loader 가중치 설정 방식 개선
- **신규 및 개선 (New & Improvement)**
  - `Random LoRA Loader` 가중치 개별/공통 설정 기능 추가
    - **개별설정(individual)**: 기존과 동일하게 무작위 선택된 각 LoRA 모델에 매핑된 개별 강도(strength) 값을 반영.
    - **공통설정(common)**: 무작위 선택된 LoRA에 무관하게 공통의 가중치 방식을 사용.
      - **고정(fixed)**: 입력된 고정값(`common_fixed_strength`)을 모든 LoRA에 적용.
      - **랜덤(random)**: 설정 범위(`common_min_strength` ~ `common_max_strength`) 내에서 seed에 기반해 무작위 가중치 추출 적용.
  - **동적 UI/UX 적용**:
    - `weight_mode` 및 `common_type` 선택에 따라 관련 입력 위젯들만 유동적으로 화면에 보이고 숨김 처리되어 직관적인 UX를 제공하도록 JS 로직 수정.
    - 선택 위젯 개수에 맞추어 노드의 전체 크기(높이)가 매끄럽게 자동 조절되도록 최적화.

## [260625-21:36] - 동적 위젯 숨김 버그 수정
- **오류 수정 (Fix)**
  - `Random LoRA Loader` 및 `Random UNET Loader` 노드에서 사용하지 않는 위젯들이 숨겨지지 않고 전부 렌더링되던 문제 수정
  - LiteGraph의 `draw` 및 `computeSize` 메서드를 동적으로 백업/오버라이드하여, 화면에서 완전히 노출되지 않고 크기가 0으로 보장되게 처리
  - 초기 생성 시 1개 모델만 노출되는 기본 상태 정상화

## [260625-21:32] - 노드 파일 모듈화 분리 작업
- **개선 (Improvement)**
  - 각 커스텀 노드를 전용 파이썬 파일로 개별 분리하여 코드 모듈화 구성
    - `nodes/easy_guide.py`: EasyGuideMaker / Viewer 노드 및 API 저장 엔드포인트 분리
    - `nodes/random_lora.py`: RandomLoraLoader 노드 분리
    - `nodes/random_unet.py`: RandomUNETLoader 노드 분리
    - `nodes/__init__.py`: 각 노드 클래스 통합 및 패키지 진입점 설정
  - 기존 단일 `nodes.py` 파일 제거

## [260625-21:30] - Random UNET Loader 추가 및 Random LoRA Loader 개선
- **신규 (New)**
  - `Random UNET Loader` 노드 추가: 여러 UNET 모델 중 1개를 랜덤으로 지정하여 로드
  - ComfyUI 기본 '확산 모델 로드' 처럼 output(model) 지원
  - 동적 UI: UNET 모델과 가중치 데이터 유형 옵션(`weight_dtype`)이 한 세트로 묶여 '+' 및 '-' 버튼으로 추가/삭제 가능 (최대 15개)
- **개선 (Improvement)**
  - `Random LoRA Loader` 개선: 초기 생성 및 기본 상태에서 첫 번째 LoRA 설정이 "None"이 아닌 실제 폴더 내 첫 번째 LoRA 명칭으로 지정되도록 기본값 변경

## [260625-21:16] - Random LoRA Loader (랜덤로라로더) 커스텀 노드 추가
- **신규 (New)**
  - `Random LoRA Loader` 노드 추가: 여러 LoRA 모델 중 1개를 랜덤으로 선택하여 로드
  - ComfyUI 기본 'LoRA 로드' 처럼 input(model, clip) 및 output(model, clip) 지원
  - 동적 UI: '+' 및 '-' 버튼을 지원하여 추가할 때마다 노드 세로 크기가 자동으로 길어지게 함 (최대 15개)
  - LoRA 모델당 강도(strength) 설정 개별 세트 매핑 및 seed 기반의 랜덤화 지원

## [260623-14:00] - 이지 가이드 노드 추가 및 UI 버그 수정
- **신규 (New)**
  - `EasyGuideMaker` 노드 추가: 워크플로우 내 노드들의 초기 세팅 저장, 초기화 기능, 메모 및 다운로드 링크 입력 기능 제공
  - `EasyGuideViewer` 노드 추가: 연결된 Maker 노드의 실시간 설정값 가이드 데이터 뷰어 기능 제공
- **오류 수정 (Fix)**
  - 가이드 데이터(`guide_data`) JSON 텍스트가 노드 배경에 누적되어 출력되는 잔상 문제 해결 (위젯 타입을 `CONVERTED-widget`으로 우회하고 draw/computeSize 함수 오버라이드로 숨김 처리)
  - DOM UI 위젯이 노드의 경계를 뚫고 나오는 레이아웃 오버플로우 문제 수정 (CSS 및 JS absolute 스타일 조정)
- **개선 (Improvement)**
  - CSS UI 테마를 Sleek Dark Modern 스타일로 개선 및 뷰어 미리보기 모달 UI 추가
