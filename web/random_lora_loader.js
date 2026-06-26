import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "PromptMaster.RandomLoraLoader",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "RandomLoraLoader") {
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);
                
                this.active_lora_count = 1;
                this.max_loras = 15;
                
                const hideWidget = (w) => {
                    if (!w || w.type === "converted-widget") return;
                    w.origType = w.type;
                    w.origDraw = w.draw;
                    w.origComputeSize = w.computeSize;
                    w.type = "converted-widget";
                    w.draw = () => {};
                    w.computeSize = () => [0, 0];
                };
                
                const showWidget = (w, defaultType) => {
                    if (!w || w.type !== "converted-widget") return;
                    w.type = w.origType || defaultType;
                    w.draw = w.origDraw;
                    w.computeSize = w.origComputeSize;
                    delete w.origType;
                    delete w.origDraw;
                    delete w.origComputeSize;
                };
                
                const updateWidgets = () => {
                    const weightModeWidget = this.widgets.find(w => w.name === "weight_mode");
                    const commonTypeWidget = this.widgets.find(w => w.name === "common_type");
                    const commonFixedWidget = this.widgets.find(w => w.name === "common_fixed_strength");
                    const commonMinWidget = this.widgets.find(w => w.name === "common_min_strength");
                    const commonMaxWidget = this.widgets.find(w => w.name === "common_max_strength");
                    
                    const weightMode = weightModeWidget ? weightModeWidget.value : "individual";
                    const commonType = commonTypeWidget ? commonTypeWidget.value : "fixed";
                    
                    let visibleExtraWidgetsCount = 0;
                    
                    if (weightMode === "common") {
                        showWidget(commonTypeWidget, "combo");
                        visibleExtraWidgetsCount += 1; // common_type 노출
                        
                        if (commonType === "fixed") {
                            showWidget(commonFixedWidget, "number");
                            hideWidget(commonMinWidget);
                            hideWidget(commonMaxWidget);
                            visibleExtraWidgetsCount += 1; // common_fixed_strength 노출
                        } else {
                            hideWidget(commonFixedWidget);
                            showWidget(commonMinWidget, "number");
                            showWidget(commonMaxWidget, "number");
                            visibleExtraWidgetsCount += 2; // min, max 두 개 노출
                        }
                    } else {
                        hideWidget(commonTypeWidget);
                        hideWidget(commonFixedWidget);
                        hideWidget(commonMinWidget);
                        hideWidget(commonMaxWidget);
                    }
                    
                    for (let i = 1; i <= this.max_loras; i++) {
                        const nameWidget = this.widgets.find(w => w.name === `lora_${i}_name`);
                        const strengthWidget = this.widgets.find(w => w.name === `lora_${i}_strength`);
                        
                        if (nameWidget && strengthWidget) {
                            if (i <= this.active_lora_count) {
                                showWidget(nameWidget, "combo");
                                if (weightMode === "individual") {
                                    showWidget(strengthWidget, "number");
                                } else {
                                    hideWidget(strengthWidget);
                                }
                            } else {
                                hideWidget(nameWidget);
                                hideWidget(strengthWidget);
                            }
                        }
                    }
                    
                    // 기본 높이 설정 및 노출되는 위젯 수에 따른 계산 조정
                    // seed(1), weight_mode(1) + visibleExtraWidgets (common_type, fixed, min, max 등)
                    // + active_lora_count개수의 combo(그리고 weightMode가 individual일 때는 strength 추가)
                    const baseHeight = 140;
                    const widgetRowHeight = 28; // 대략적인 위젯당 추가 높이
                    
                    let activeWidgetRows = 2; // model, clip은 input 링크이고, seed와 weight_mode는 기본 항상 존재
                    activeWidgetRows += visibleExtraWidgetsCount;
                    activeWidgetRows += this.active_lora_count; // 각 lora combo
                    if (weightMode === "individual") {
                        activeWidgetRows += this.active_lora_count; // 각 lora strength
                    }
                    activeWidgetRows += 2; // ➕ ➖ 버튼 2개
                    
                    const calculatedHeight = baseHeight + (activeWidgetRows * widgetRowHeight);
                    
                    this.setSize([380, calculatedHeight]);
                    this.setDirtyCanvas(true, true);
                };
                
                this.addWidget("button", "➕ Add LoRA (로라 추가)", null, () => {
                    if (this.active_lora_count < this.max_loras) {
                        this.active_lora_count++;
                        updateWidgets();
                    }
                });
                
                this.addWidget("button", "➖ Remove LoRA (로라 삭제)", null, () => {
                    if (this.active_lora_count > 1) {
                        const nameWidget = this.widgets.find(w => w.name === `lora_${this.active_lora_count}_name`);
                        if (nameWidget) {
                            nameWidget.value = "None";
                        }
                        this.active_lora_count--;
                        updateWidgets();
                    }
                });
                
                // widget 값 변경 이벤트 리스너 추가
                setTimeout(() => {
                    const weightModeWidget = this.widgets.find(w => w.name === "weight_mode");
                    if (weightModeWidget) {
                        const origCallback = weightModeWidget.callback;
                        weightModeWidget.callback = function() {
                            if (origCallback) origCallback.apply(this, arguments);
                            updateWidgets();
                        };
                    }
                    const commonTypeWidget = this.widgets.find(w => w.name === "common_type");
                    if (commonTypeWidget) {
                        const origCallback = commonTypeWidget.callback;
                        commonTypeWidget.callback = function() {
                            if (origCallback) origCallback.apply(this, arguments);
                            updateWidgets();
                        };
                    }
                    updateWidgets();
                }, 1);
                
                this.updateWidgets = updateWidgets;
            };
            
            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function (info) {
                if (onConfigure) onConfigure.apply(this, arguments);
                
                let maxActiveIndex = 1;
                for (let i = 1; i <= 15; i++) {
                    const nameWidget = this.widgets.find(w => w.name === `lora_${i}_name`);
                    if (nameWidget && nameWidget.value && nameWidget.value !== "None") {
                        maxActiveIndex = i;
                    }
                }
                
                this.active_lora_count = maxActiveIndex;
                if (this.updateWidgets) {
                    this.updateWidgets();
                }
            };
        }
    }
});
