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
                
                const updateWidgets = () => {
                    for (let i = 1; i <= this.max_unets; i++) {
                        const nameWidget = this.widgets.find(w => w.name === `unet_${i}_name`);
                        const dtypeWidget = this.widgets.find(w => w.name === `unet_${i}_dtype`);
                        
                        if (nameWidget && dtypeWidget) {
                            if (i <= this.active_unet_count) {
                                nameWidget.type = "combo";
                                dtypeWidget.type = "combo";
                            } else {
                                nameWidget.type = "converted-widget";
                                dtypeWidget.type = "converted-widget";
                            }
                        }
                    }
                    
                    const baseHeight = 180;
                    const calculatedHeight = baseHeight + (this.active_unet_count - 1) * 60;
                    
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
