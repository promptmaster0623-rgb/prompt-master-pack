import { app } from "../../../scripts/app.js";

app.registerExtension({
    name: "PromptMaster.RandomUNETLoader",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "RandomUNETLoader") {
            
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);
                
                this.active_unet_count = 1;
                this.max_unets = 15;
                
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
                    for (let i = 1; i <= this.max_unets; i++) {
                        const nameWidget = this.widgets.find(w => w.name === `unet_${i}_name`);
                        const dtypeWidget = this.widgets.find(w => w.name === `unet_${i}_dtype`);
                        
                        if (nameWidget && dtypeWidget) {
                            if (i <= this.active_unet_count) {
                                showWidget(nameWidget, "combo");
                                showWidget(dtypeWidget, "combo");
                            } else {
                                hideWidget(nameWidget);
                                hideWidget(dtypeWidget);
                            }
                        }
                    }
                    
                    const baseHeight = 150;
                    const calculatedHeight = baseHeight + (this.active_unet_count - 1) * 55;
                    
                    this.setSize([350, calculatedHeight]);
                    this.setDirtyCanvas(true, true);
                };
                
                this.addWidget("button", "➕ Add UNET (UNET 추가)", null, () => {
                    if (this.active_unet_count < this.max_unets) {
                        this.active_unet_count++;
                        updateWidgets();
                    }
                });
                
                this.addWidget("button", "➖ Remove UNET (UNET 삭제)", null, () => {
                    if (this.active_unet_count > 1) {
                        const nameWidget = this.widgets.find(w => w.name === `unet_${this.active_unet_count}_name`);
                        if (nameWidget) {
                            nameWidget.value = "None";
                        }
                        this.active_unet_count--;
                        updateWidgets();
                    }
                });
                
                setTimeout(() => {
                    updateWidgets();
                }, 1);
                
                this.updateWidgets = updateWidgets;
            };
            
            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function (info) {
                if (onConfigure) onConfigure.apply(this, arguments);
                
                let maxActiveIndex = 1;
                for (let i = 1; i <= 15; i++) {
                    const nameWidget = this.widgets.find(w => w.name === `unet_${i}_name`);
                    if (nameWidget && nameWidget.value && nameWidget.value !== "None") {
                        maxActiveIndex = i;
                    }
                }
                
                this.active_unet_count = maxActiveIndex;
                if (this.updateWidgets) {
                    this.updateWidgets();
                }
            };
        }
    }
});
