prompt-master-pack/
├── __init__.py                # 기존 엔트리포인트를 유지하며 nodes 패키지로부터 노드 호출
├── CHANGELOG.md               # [260625-21:32] 이력 추가
├── nodes/                     # 🆕 커스텀 노드 모듈 전용 폴더
│   ├── __init__.py            # 각 노드 클래스들을 한데 묶어 내보내는 패키지 이니셜라이저
│   ├── easy_guide.py          # EasyGuideMaker, EasyGuideViewer 및 설정 저장용 API 관련 로직
│   ├── random_lora.py         # RandomLoraLoader 관련 로직
│   └── random_unet.py         # RandomUNETLoader 관련 로직
└── web/
    ├── easy_guide.css
    ├── easy_guide.js
    ├── random_lora_loader.js
    └── random_unet_loader.js

    
