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
                
                const updateWidgets = () => {
                    for (let i = 1; i <= this.max_loras; i++) {
                        const nameWidget = this.widgets.find(w => w.name === `lora_${i}_name`);
                        const strengthWidget = this.widgets.find(w => w.name === `lora_${i}_strength`);
                        
                        if (nameWidget && strengthWidget) {
                            if (i <= this.active_lora_count) {
                                nameWidget.type = "combo";
                                strengthWidget.type = "number";
                            } else {
                                nameWidget.type = "converted-widget";
                                strengthWidget.type = "converted-widget";
                            }
                        }
                    }
                    
                    // Base size calculating
                    const baseHeight = 180;
                    const calculatedHeight = baseHeight + (this.active_lora_count - 1) * 60;
                    
                    this.setSize([350, calculatedHeight]);
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
