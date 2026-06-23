import { app } from "../../../scripts/app.js";
import { api } from "../../../scripts/api.js";

// Helper to inject our stylesheet dynamically
const link = document.createElement("link");
link.rel = "stylesheet"; link.href = new URL("./easy_guide.css", import.meta.url).href;
document.head.appendChild(link);

// Custom Modal Utility for Premium UX
function showModal(title, contentHtml, onConfirm = null, showCancel = true) {
    const backdrop = document.createElement("div");
    backdrop.className = "easy-guide-modal-backdrop";

    const modal = document.createElement("div");
    modal.className = "easy-guide-modal";

    modal.innerHTML = `
        <div class="easy-guide-modal-header">${title}</div>
        <div class="easy-guide-modal-body">${contentHtml}</div>
        <div class="easy-guide-modal-footer"></div>
    `;

    const footer = modal.querySelector(".easy-guide-modal-footer");
    
    if (showCancel) {
        const cancelBtn = document.createElement("button");
        cancelBtn.className = "easy-guide-btn secondary";
        cancelBtn.innerText = "취소";
        cancelBtn.onclick = () => {
            document.body.removeChild(backdrop);
        };
        footer.appendChild(cancelBtn);
    }

    const confirmBtn = document.createElement("button");
    confirmBtn.className = "easy-guide-btn primary";
    confirmBtn.innerText = "확인";
    confirmBtn.onclick = () => {
        if (onConfirm) onConfirm(backdrop);
        else document.body.removeChild(backdrop);
    };
    footer.appendChild(confirmBtn);

    backdrop.appendChild(modal);
    document.body.appendChild(backdrop);
    
    setTimeout(() => {
        backdrop.classList.add("show");
    }, 10);
    
    return backdrop;
}

// Convert configuration to Markdown format
function convertToMarkdown(setupData) {
    let md = `## 🚀 Prompt Master Pack - Easy Guide Settings\n`;
    md += `*이 설정은 [Prompt Master Pack](https://github.com/promptmaster0623-rgb/prompt-master-pack)을 기반으로 구성되었습니다.*\n\n`;
    
    if (setupData && setupData.nodes) {
        setupData.nodes.forEach(node => {
            md += `### 📌 ${node.title} (${node.name})\n`;
            if (node.memo) {
                md += `> **메모:** ${node.memo}\n`;
            }
            if (node.downloadUrl) {
                md += `- **다운로드 URL:** [다운로드 링크](${node.downloadUrl})\n`;
            }
            if (node.widgets && node.widgets.length > 0) {
                md += `**설정값:**\n`;
                node.widgets.forEach(w => {
                    md += `- **${w.name}:** \`${w.value}\`\n`;
                });
            }
            md += `\n---\n\n`;
        });
    }
    return md;
}

app.registerExtension({
    name: "PromptMaster.EasyGuide",
    async beforeRegisterNodeDef(nodeType, nodeData, app) {
        if (nodeData.name === "EasyGuideMaker") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);
                
                this.setSize([400, 500]);
                
                this.properties = this.properties || {};
                this.properties.savedSetup = this.properties.savedSetup || null; // For reset values
                this.properties.nodesList = this.properties.nodesList || []; // List of guides: { id, name, title, memo, downloadUrl }

                // Hide the guide_data widget to keep node background clean
                const widget = this.widgets.find(w => w.name === "guide_data");
                if (widget) {
                    widget.type = "CONVERTED-widget"; // ComfyUI handles hidden widgets well via custom types
                    widget.draw = () => {};
                    widget.computeSize = () => [0, 0];
                }

                // Auto-populate node list on creation with option nodes in workflow
                const autoList = [];
                app.graph._nodes.forEach(n => {
                    if (n.widgets && n.widgets.length > 0 && n.id !== this.id) {
                        autoList.push({
                            id: n.id,
                            name: n.type,
                            title: n.title || n.type,
                            memo: "",
                            downloadUrl: ""
                        });
                    }
                });
                this.properties.nodesList = autoList;

                // Create container element
                const container = document.createElement("div");
                container.className = "easy-guide-maker-container";

                // Setup header buttons
                const btnRow = document.createElement("div");
                btnRow.className = "easy-guide-btn-row";

                const saveSetupBtn = document.createElement("button");
                saveSetupBtn.className = "easy-guide-btn primary";
                saveSetupBtn.innerText = "초기세팅저장";
                saveSetupBtn.onclick = () => {
                    showModal(
                        "초기 세팅 저장",
                        "<p>현재 워크플로우에 세팅된 모든 노드들의 세팅값이 저장됩니다.</p><p style='color: #ff4d4f; font-weight: bold;'>※ 주의: 이 초기세팅 저장은 워크플로우를 맨 처음 원상태로 되돌리는 '초기화' 버튼 동작에만 사용됩니다.</p>",
                        (modalBackdrop) => {
                            // Only capture full config for resetting values
                            const fullConfig = {};
                            app.graph._nodes.forEach(n => {
                                if (n.widgets) {
                                    fullConfig[n.id] = n.widgets.map(w => ({ name: w.name, value: w.value }));
                                }
                            });
                            this.properties.savedSetup = fullConfig;
                            document.body.removeChild(modalBackdrop);
                            alert("초기 세팅이 정상적으로 저장되었습니다!");
                        }
                    );
                };

                const resetBtn = document.createElement("button");
                resetBtn.className = "easy-guide-btn danger";
                resetBtn.innerText = "초기화";
                resetBtn.onclick = () => {
                    if (!this.properties.savedSetup) {
                        alert("저장된 초기 세팅이 없습니다. 먼저 '초기세팅저장'을 진행해주세요.");
                        return;
                    }
                    showModal(
                        "워크플로우 초기화",
                        "<p>저장된 초기 세팅값으로 모든 노드의 설정값이 되돌아갑니다.</p><p style='color: #ff4d4f; font-weight: bold;'>정말로 진행하시겠습니까?</p>",
                        (modalBackdrop) => {
                            const config = this.properties.savedSetup;
                            app.graph._nodes.forEach(n => {
                                if (config[n.id]) {
                                    config[n.id].forEach(savedWidget => {
                                        const actualWidget = n.widgets?.find(w => w.name === savedWidget.name);
                                        if (actualWidget) {
                                            actualWidget.value = savedWidget.value;
                                            if (actualWidget.callback) {
                                                actualWidget.callback(savedWidget.value, app.canvas, n, [0, 0], {});
                                            }
                                        }
                                    });
                                }
                            });
                            app.graph.setDirtyCanvas(true, true);
                            document.body.removeChild(modalBackdrop);
                            alert("워크플로우 초기화가 완료되었습니다.");
                            this.triggerSync();
                        }
                    );
                };

                btnRow.appendChild(saveSetupBtn);
                btnRow.appendChild(resetBtn);
                container.appendChild(btnRow);

                // Add Node Row
                const addRow = document.createElement("div");
                addRow.className = "easy-guide-add-row";
                
                const selectNode = document.createElement("select");
                selectNode.className = "easy-guide-select";
                
                const populateNodeDropdown = () => {
                    selectNode.innerHTML = "";
                    const defaultOption = document.createElement("option");
                    defaultOption.value = "";
                    defaultOption.innerText = "-- 가이드 대상 노드 선택 --";
                    selectNode.appendChild(defaultOption);

                    app.graph._nodes.forEach(n => {
                        if (n.id !== this.id) {
                            const opt = document.createElement("option");
                            opt.value = n.id;
                            opt.innerText = `[${n.id}] ${n.title || n.type}`;
                            selectNode.appendChild(opt);
                        }
                    });
                };
                
                populateNodeDropdown();
                
                const addNodeBtn = document.createElement("button");
                addNodeBtn.className = "easy-guide-btn add-btn";
                addNodeBtn.innerText = "추가";
                addNodeBtn.onclick = () => {
                    const selId = selectNode.value;
                    if (!selId) return;
                    const node = app.graph._nodes.find(n => String(n.id) === String(selId));
                    if (node) {
                        const exists = this.properties.nodesList.some(item => String(item.id) === String(selId));
                        if (exists) {
                            alert("이미 리스트에 존재하는 노드입니다.");
                            return;
                        }
                        this.properties.nodesList.push({
                            id: node.id,
                            name: node.type,
                            title: node.title || node.type,
                            memo: "",
                            downloadUrl: ""
                        });
                        this.updateListUI(listBody);
                        populateNodeDropdown();
                    }
                };

                addRow.appendChild(selectNode);
                addRow.appendChild(addNodeBtn);
                container.appendChild(addRow);

                // List Container
                const listBody = document.createElement("div");
                listBody.className = "easy-guide-list-body";
                container.appendChild(listBody);

                // Preview & Export Footer Buttons
                const footerRow = document.createElement("div");
                footerRow.className = "easy-guide-footer-row";

                const previewBtn = document.createElement("button");
                previewBtn.className = "easy-guide-btn info";
                previewBtn.innerText = "Easy guide viewer 미리보기";
                previewBtn.style.flex = "1";
                previewBtn.onclick = () => {
                    const fullJson = this.generateViewerJson();
                    const backdrop = showModal(
                        "Easy Guide Viewer 미리보기",
                        `
                            <div class="easy-guide-preview-area">
                                <div class="easy-guide-preview-title">이지 가이드 미리보기 화면</div>
                                <div class="easy-guide-preview-list">
                                    ${JSON.parse(fullJson).nodes.map(n => `
                                        <div class="easy-guide-preview-item">
                                            <div class="easy-guide-preview-item-header">📌 ${n.title} (${n.name})</div>
                                            <div class="easy-guide-preview-item-content">
                                                ${n.memo ? `<div class="easy-guide-preview-memo">💡 ${n.memo}</div>` : ""}
                                                ${n.downloadUrl ? `<div class="easy-guide-preview-download"><a href="${n.downloadUrl}" target="_blank">🔗 모델 다운로드 링크</a></div>` : ""}
                                                <table class="easy-guide-preview-table">
                                                    ${n.widgets.map(w => `
                                                        <tr>
                                                            <td class="easy-guide-preview-widget-name">${w.name}</td>
                                                            <td class="easy-guide-preview-widget-val">${w.value}</td>
                                                        </tr>
                                                    `).join("")}
                                                </table>
                                            </div>
                                        </div>
                                    `).join("")}
                                </div>
                            </div>
                        `,
                        null,
                        true
                    );
                    
                    const footer = backdrop.querySelector(".easy-guide-modal-footer");
                    footer.innerHTML = ""; // Clear standard buttons
                    
                    const saveJsonBtn = document.createElement("button");
                    saveJsonBtn.className = "easy-guide-btn primary";
                    saveJsonBtn.innerText = "현재세팅 JSON저장";
                    saveJsonBtn.onclick = async () => {
                        // Obtain workflow name or use default
                        let workflowName = "untitled_workflow";
                        if (app.ui && app.ui.currentWorkflowName) {
                            workflowName = app.ui.currentWorkflowName;
                        } else if (app.graph && app.graph.filename) {
                            workflowName = app.graph.filename.split('.').slice(0, -1).join('.') || app.graph.filename;
                        } else if (app.workflowName) {
                            workflowName = app.workflowName;
                        } else if (window.ComfyApp && window.ComfyApp.currentWorkflowName) {
                            workflowName = window.ComfyApp.currentWorkflowName;
                        }
                        
                        try {
                            const response = await api.fetchApi("/easy-guide/save", {
                                method: "POST",
                                headers: { "Content-Type": "application/json" },
                                body: JSON.stringify({
                                    workflow_name: workflowName,
                                    json_data: JSON.parse(fullJson)
                                })
                            });
                            const res = await response.json();
                            if (res.status === "success") {
                                alert(`JSON 파일이 커스텀 노드 폴더 아래에 정상 저장되었습니다!\n경로: guides/${workflowName}/easy_guide_settings.json`);
                            } else {
                                alert("저장 실패: " + res.message);
                            }
                        } catch (err) {
                            console.error(err);
                            alert("서버 연결 실패: " + err.message);
                        }
                    };
                    
                    const copyMdBtn = document.createElement("button");
                    copyMdBtn.className = "easy-guide-btn info";
                    copyMdBtn.innerText = "마크다운노트용 복사";
                    copyMdBtn.onclick = () => {
                        const mdText = convertToMarkdown(JSON.parse(fullJson));
                        navigator.clipboard.writeText(mdText).then(() => {
                            alert("클립보드에 마크다운 형식이 성공적으로 복사되었습니다!");
                        });
                    };

                    const closeBtn = document.createElement("button");
                    closeBtn.className = "easy-guide-btn secondary";
                    closeBtn.innerText = "닫기";
                    closeBtn.onclick = () => {
                        document.body.removeChild(backdrop);
                    };

                    footer.appendChild(saveJsonBtn);
                    footer.appendChild(copyMdBtn);
                    footer.appendChild(closeBtn);
                };

                footerRow.appendChild(previewBtn);
                container.appendChild(footerRow);

                this.updateListUI = (listEl) => {
                    listEl.innerHTML = "";
                    if (this.properties.nodesList.length === 0) {
                        listEl.innerHTML = `<div style="text-align: center; color: #888; padding: 20px;">등록된 가이드 노드가 없습니다.</div>`;
                        return;
                    }

                    this.properties.nodesList.forEach((item, idx) => {
                        const targetNode = app.graph._nodes.find(n => String(n.id) === String(item.id));
                        if (!targetNode) return;

                        const itemDiv = document.createElement("div");
                        itemDiv.className = "easy-guide-list-item";

                        const itemHeader = document.createElement("div");
                        itemHeader.className = "easy-guide-item-header";
                        itemHeader.innerHTML = `<span class="easy-guide-item-title">${item.title}</span>`;

                        // Accordion expansion
                        itemHeader.onclick = (e) => {
                            if (e.target.tagName === "BUTTON" || e.target.tagName === "A" || e.target.tagName === "INPUT") return;
                            
                            const allContents = listEl.querySelectorAll(".easy-guide-item-details");
                            const details = itemDiv.querySelector(".easy-guide-item-details");
                            const isOpen = details.classList.contains("open");
                            
                            allContents.forEach(c => c.classList.remove("open"));
                            if (!isOpen) {
                                details.classList.add("open");
                            }
                        };

                        const actionsDiv = document.createElement("div");
                        actionsDiv.className = "easy-guide-item-actions";

                        // Memo Button
                        const memoBtn = document.createElement("button");
                        memoBtn.className = "easy-guide-btn-small memo-btn";
                        memoBtn.innerText = item.memo ? "메모📝" : "메모+";
                        memoBtn.onclick = () => {
                            const newMemo = prompt("노드에 대한 안내 메모를 입력하세요:", item.memo);
                            if (newMemo !== null) {
                                item.memo = newMemo;
                                memoBtn.innerText = newMemo ? "메모📝" : "메모+";
                                this.updateWidgetsData();
                            }
                        };

                        // Check if model node to add URL button
                        const isModelNode = item.name.toLowerCase().includes("loader") ||
                                            item.name.toLowerCase().includes("checkpoint") ||
                                            item.name.toLowerCase().includes("lora") ||
                                            (targetNode.widgets && targetNode.widgets.some(w => w.name.toLowerCase().includes("model") || w.name.toLowerCase().includes("ckpt")));
                        
                        let urlBtn = null;
                        if (isModelNode) {
                            urlBtn = document.createElement("button");
                            urlBtn.className = "easy-guide-btn-small url-btn";
                            urlBtn.innerText = item.downloadUrl ? "URL🔗" : "URL+";
                            urlBtn.onclick = () => {
                                const newUrl = prompt("모델 다운로드 URL을 입력하세요:", item.downloadUrl);
                                if (newUrl !== null) {
                                    item.downloadUrl = newUrl;
                                    urlBtn.innerText = newUrl ? "URL🔗" : "URL+";
                                    this.updateWidgetsData();
                                }
                            };
                        }

                        // Delete Button
                        const delBtn = document.createElement("button");
                        delBtn.className = "easy-guide-btn-small delete-btn";
                        delBtn.innerText = "삭제";
                        delBtn.onclick = () => {
                            this.properties.nodesList.splice(idx, 1);
                            this.updateListUI(listEl);
                            populateNodeDropdown();
                            this.updateWidgetsData();
                        };

                        actionsDiv.appendChild(memoBtn);
                        if (urlBtn) actionsDiv.appendChild(urlBtn);
                        actionsDiv.appendChild(delBtn);
                        itemHeader.appendChild(actionsDiv);
                        itemDiv.appendChild(itemHeader);

                        // Detail Accordion Panel
                        const itemDetails = document.createElement("div");
                        itemDetails.className = "easy-guide-item-details";
                        
                        let widgetsHtml = "";
                        if (targetNode.widgets && targetNode.widgets.length > 0) {
                            widgetsHtml = `
                                <table class="easy-guide-widget-table">
                                    ${targetNode.widgets.map(w => `
                                        <tr>
                                            <th>${w.name}</th>
                                            <td>${w.value}</td>
                                        </tr>
                                    `).join("")}
                                </table>
                            `;
                        } else {
                            widgetsHtml = `<div class="easy-guide-no-widgets">옵션 세팅값이 존재하지 않는 노드입니다.</div>`;
                        }

                        itemDetails.innerHTML = widgetsHtml;
                        itemDiv.appendChild(itemDetails);

                        listEl.appendChild(itemDiv);
                    });
                    
                    this.updateWidgetsData();
                };

                this.generateViewerJson = () => {
                    const fullData = {
                        nodes: this.properties.nodesList.map(item => {
                            const targetNode = app.graph._nodes.find(n => String(n.id) === String(item.id));
                            const widgets = targetNode?.widgets ? targetNode.widgets.map(w => ({ name: w.name, value: w.value })) : [];
                            return {
                                id: item.id,
                                name: item.name,
                                title: item.title,
                                memo: item.memo,
                                downloadUrl: item.downloadUrl,
                                widgets: widgets
                            };
                        })
                    };
                    return JSON.stringify(fullData, null, 2);
                };

                this.updateWidgetsData = () => {
                    const widget = this.widgets.find(w => w.name === "guide_data");
                    if (widget) {
                        widget.value = this.generateViewerJson();
                    }
                    this.triggerSync();
                };

                // Trigger real-time synchronization to linked EasyGuideViewer nodes
                this.triggerSync = () => {
                    if (!this.outputs || this.outputs.length === 0) return;
                    const outLinkIds = this.outputs[0].links;
                    if (!outLinkIds || outLinkIds.length === 0) return;

                    outLinkIds.forEach(linkId => {
                        const link = app.graph.links[linkId];
                        if (link) {
                            const targetNode = app.graph.getNodeById(link.target_id);
                            if (targetNode && targetNode.type === "EasyGuideViewer") {
                                // Sync immediately
                                targetNode.updateViewerUI(this.widgets.find(w => w.name === "guide_data")?.value);
                            }
                        }
                    });
                };

                this.updateListUI(listBody);
                const domWidget = this.addDOMWidget("easy_guide_maker_ui", "HTML", container);
                if (domWidget) {
                    domWidget.serialize = false;
                    // 스타일을 지정하여 노드 크기를 넘어가지 않도록 함
                    container.style.position = "absolute";
                    container.style.top = "30px";
                    container.style.left = "10px";
                    container.style.width = "calc(100% - 20px)";
                    container.style.height = "calc(100% - 40px)";
                    container.style.zIndex = "10";
                }
            };

            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function () {
                if (onConfigure) onConfigure.apply(this, arguments);
                const widget = this.widgets.find(w => w.name === "guide_data");
                if (widget && widget.value) {
                    try {
                        const data = JSON.parse(widget.value);
                        if (data.nodes) {
                            this.properties.nodesList = data.nodes.map(n => ({
                                id: n.id,
                                name: n.name,
                                title: n.title,
                                memo: n.memo || "",
                                downloadUrl: n.downloadUrl || ""
                            }));
                        }
                    } catch (e) {
                        console.error(e);
                    }
                }
            };
        }

        if (nodeData.name === "EasyGuideViewer") {
            const onNodeCreated = nodeType.prototype.onNodeCreated;
            nodeType.prototype.onNodeCreated = function () {
                if (onNodeCreated) onNodeCreated.apply(this, arguments);

                this.setSize([450, 600]);

                const container = document.createElement("div");
                container.className = "easy-guide-viewer-container";

                const viewerHeader = document.createElement("div");
                viewerHeader.className = "easy-guide-viewer-header";
                viewerHeader.innerText = "Easy Guide Viewer";
                container.appendChild(viewerHeader);

                const listBody = document.createElement("div");
                listBody.className = "easy-guide-viewer-list";
                container.appendChild(listBody);

                const footerRow = document.createElement("div");
                footerRow.className = "easy-guide-viewer-footer";

                // Refresh Button
                const refreshBtn = document.createElement("button");
                refreshBtn.className = "easy-guide-btn info";
                refreshBtn.innerText = "새로고침";
                refreshBtn.onclick = () => {
                    // Pull data from connected link
                    if (this.inputs && this.inputs.length > 0) {
                        const linkId = this.inputs[0].link;
                        if (linkId !== null) {
                            const link = app.graph.links[linkId];
                            if (link) {
                                const originNode = app.graph.getNodeById(link.origin_id);
                                if (originNode && originNode.type === "EasyGuideMaker") {
                                    const guideData = originNode.widgets?.find(w => w.name === "guide_data")?.value;
                                    this.updateViewerUI(guideData);
                                    alert("성공적으로 새로고침되었습니다!");
                                    return;
                                }
                            }
                        }
                    }
                    alert("연결된 Easy Guide Maker 노드가 없거나 데이터를 가져올 수 없습니다.");
                };

                const copyMdBtn = document.createElement("button");
                copyMdBtn.className = "easy-guide-btn primary";
                copyMdBtn.innerText = "마크다운노트용 복사";
                copyMdBtn.onclick = () => {
                    // Try to get data from connected input link or fallback to local property
                    let widgetVal = null;
                    if (this.inputs && this.inputs.length > 0) {
                        const linkId = this.inputs[0].link;
                        if (linkId !== null) {
                            const link = app.graph.links[linkId];
                            if (link) {
                                const originNode = app.graph.getNodeById(link.origin_id);
                                if (originNode && originNode.type === "EasyGuideMaker") {
                                    widgetVal = originNode.widgets?.find(w => w.name === "guide_data")?.value;
                                }
                            }
                        }
                    }
                    
                    if (!widgetVal) {
                        // Fallback to widget if somehow present
                        widgetVal = this.widgets.find(w => w.name === "guide_data")?.value;
                    }

                    if (widgetVal) {
                        try {
                            const parsed = JSON.parse(widgetVal);
                            const mdText = convertToMarkdown(parsed);
                            navigator.clipboard.writeText(mdText).then(() => {
                                alert("클립보드에 마크다운 형식이 성공적으로 복사되었습니다!");
                            });
                        } catch (e) {
                            alert("유효하지 않은 가이드 데이터입니다.");
                        }
                    } else {
                        alert("가이드 데이터가 존재하지 않습니다.");
                    }
                };

                footerRow.appendChild(refreshBtn);
                footerRow.appendChild(copyMdBtn);
                container.appendChild(footerRow);

                this.updateViewerUI = (dataStr) => {
                    listBody.innerHTML = "";
                    if (!dataStr) {
                        listBody.innerHTML = `<div style="text-align: center; color: #888; padding: 20px;">가이드 데이터를 입력받아 가이드를 표시합니다.</div>`;
                        return;
                    }
                    try {
                        const parsed = JSON.parse(dataStr);
                        if (!parsed.nodes || parsed.nodes.length === 0) {
                            listBody.innerHTML = `<div style="text-align: center; color: #888; padding: 20px;">가이드에 표시할 노드가 존재하지 않습니다.</div>`;
                            return;
                        }

                        parsed.nodes.forEach(n => {
                            const itemDiv = document.createElement("div");
                            itemDiv.className = "easy-guide-preview-item";

                            let widgetRows = "";
                            if (n.widgets && n.widgets.length > 0) {
                                widgetRows = n.widgets.map(w => `
                                    <tr>
                                        <td class="easy-guide-preview-widget-name">${w.name}</td>
                                        <td class="easy-guide-preview-widget-val">${w.value}</td>
                                    </tr>
                                `).join("");
                            }

                            itemDiv.innerHTML = `
                                <div class="easy-guide-preview-item-header">📌 ${n.title} (${n.name})</div>
                                <div class="easy-guide-preview-item-content">
                                    ${n.memo ? `<div class="easy-guide-preview-memo">💡 ${n.memo}</div>` : ""}
                                    ${n.downloadUrl ? `<div class="easy-guide-preview-download"><a href="${n.downloadUrl}" target="_blank">🔗 모델 다운로드 링크</a></div>` : ""}
                                    ${widgetRows ? `<table class="easy-guide-preview-table">${widgetRows}</table>` : ""}
                                </div>
                            `;
                            listBody.appendChild(itemDiv);
                        });
                    } catch (e) {
                        listBody.innerHTML = `<div style="text-align: center; color: #ff4d4f; padding: 20px;">JSON 파싱 중 오류 발생: ${e.message}</div>`;
                    }
                };

                this.addDOMWidget("easy_guide_viewer_ui", "HTML", container);
            };

            const onExecuted = nodeType.prototype.onExecuted;
            nodeType.prototype.onExecuted = function (message) {
                if (onExecuted) onExecuted.apply(this, arguments);
                if (this.inputs && this.inputs.length > 0) {
                    const linkId = this.inputs[0].link;
                    if (linkId !== null) {
                        const link = app.graph.links[linkId];
                        if (link) {
                            const originNode = app.graph.getNodeById(link.origin_id);
                            if (originNode && originNode.type === "EasyGuideMaker") {
                                const inputVal = originNode.widgets?.find(w => w.name === "guide_data")?.value;
                                this.updateViewerUI(inputVal);
                                return;
                            }
                        }
                    }
                }
                const inputVal = this.widgets.find(w => w.name === "guide_data")?.value;
                this.updateViewerUI(inputVal);
            };

            const onConfigure = nodeType.prototype.onConfigure;
            nodeType.prototype.onConfigure = function () {
                if (onConfigure) onConfigure.apply(this, arguments);
                if (this.inputs && this.inputs.length > 0) {
                    const linkId = this.inputs[0].link;
                    if (linkId !== null) {
                        const link = app.graph.links[linkId];
                        if (link) {
                            const originNode = app.graph.getNodeById(link.origin_id);
                            if (originNode && originNode.type === "EasyGuideMaker") {
                                const inputVal = originNode.widgets?.find(w => w.name === "guide_data")?.value;
                                this.updateViewerUI(inputVal);
                                return;
                            }
                        }
                    }
                }
                const inputVal = this.widgets.find(w => w.name === "guide_data")?.value;
                this.updateViewerUI(inputVal);
            };
        }
    }
});
