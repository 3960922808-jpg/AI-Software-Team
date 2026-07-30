(function registerWorkflowState(root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.WorkflowState = api;
}(typeof globalThis === "object" ? globalThis : this, () => {
  const softwareAgents = [
    ["product", "PM", "产品经理 Agent", "需求分析与验收标准", "PRD", "需求与产品任务"],
    ["architect", "AR", "架构师 Agent", "架构设计与接口契约", "ADR", "架构与接口任务"],
    ["techlead", "TL", "技术主管 Agent", "实施规划与质量把控", "GOV", "技术治理任务"],
    ["security", "SE", "安全专家 Agent", "威胁建模与安全验收", "SEC", "安全审查任务"],
    ["frontend", "FE", "前端 Agent", "界面与交互实现", "UI", "前端实现任务"],
    ["backend", "BE", "后端 Agent", "服务与业务逻辑", "API", "后端服务任务"],
    ["database", "DB", "数据库 Agent", "模型、迁移与优化", "DATA", "数据工程任务"],
    ["tester", "QA", "测试 Agent", "自动测试与质量报告", "TEST", "测试验收任务"],
    ["reviewer", "CR", "代码审查 Agent", "缺陷审查与重构建议", "REV", "代码审查任务"],
    ["devops", "DO", "DevOps Agent", "构建、版本与运行保障", "OPS", "交付运维任务"]
  ];

  function createSoftwareTemplate() {
    const manager = { id: "commander", code: "CO", title: "灵灵 · 项目经理 Agent", subtitle: "拆解需求并向 10 个 Agent 派发任务", type: "manager", manager: true, x: 40, y: 490, width: 240 };
    const agents = softwareAgents.map(([id, code, title, subtitle], index) => ({ id, code, title, subtitle, role: title, type: "agent", x: 390, y: 20 + index * 105, width: 220 }));
    const modules = softwareAgents.map(([id, , role, , outputCode, outputTitle], index) => ({ id: `${id}-output`, code: outputCode, title: outputTitle, subtitle: `${role}继续拆分并交付的任务板块`, sourceNode: id, sourceRole: role, type: "module", x: 830, y: 20 + index * 105, width: 230 }));
    const edges = [
      ...softwareAgents.map(([id]) => ({ from: "commander", to: id, kind: "branch" })),
      ...softwareAgents.map(([id]) => ({ from: id, to: `${id}-output`, kind: "output" }))
    ];
    return { id: "software", name: "软件研发", description: "经理调度 10 个专业 Agent", width: 1500, height: 1120, nodes: [manager, ...agents, ...modules], edges };
  }

  function createMediaTemplate(id, name, description, nodes, edges) {
    return {
      id, name, description, width: 3400, height: 2100,
      nodes: nodes.map((node) => ({ type: "media", width: 290, height: 160, inputs: [], outputs: [], parameters: {}, parameterSchema: [], ...node })),
      edges: edges.map((edge, index) => ({ id: `${id}-edge-${index + 1}`, kind: "media", state: "idle", ...edge }))
    };
  }

  const imageNodes = [
    { id: "image-checkpoint", code: "MODEL", title: "加载生图模型", subtitle: "使用设置中的生图模型与编码器", x: 120, y: 720, outputs: ["MODEL", "CLIP", "VAE"], parameters: { clipSkip: 1 }, parameterSchema: [{ key: "clipSkip", label: "CLIP 跳过层", type: "number", min: 1, max: 12 }] },
    { id: "image-positive", code: "TEXT+", title: "正向提示词", subtitle: "描述主体、构图、光线和细节", role: "产品经理 Agent", x: 520, y: 260, width: 360, height: 270, inputs: ["CLIP"], outputs: ["CONDITIONING"], parameters: { prompt: "" }, parameterSchema: [{ key: "prompt", label: "提示词", type: "textarea", rows: 8 }] },
    { id: "image-negative", code: "TEXT-", title: "负向提示词", subtitle: "排除瑕疵、错误文字和不需要的元素", role: "测试 Agent", x: 520, y: 620, width: 360, height: 240, inputs: ["CLIP"], outputs: ["CONDITIONING"], parameters: { negativePrompt: "低质量，模糊，变形，错误文字" }, parameterSchema: [{ key: "negativePrompt", label: "排除内容", type: "textarea", rows: 6 }] },
    { id: "image-latent", code: "LATENT", title: "空潜空间", subtitle: "设置图片尺寸与生成数量", x: 540, y: 1020, inputs: [], outputs: ["LATENT"], parameters: { width: 1024, height: 1024, batch: 1 }, parameterSchema: [{ key: "width", label: "宽度", type: "number", min: 256, max: 4096, step: 64 }, { key: "height", label: "高度", type: "number", min: 256, max: 4096, step: 64 }, { key: "batch", label: "数量", type: "number", min: 1, max: 4 }] },
    { id: "image-sampler", code: "KSampler", title: "采样器", subtitle: "控制步数、引导强度、随机种子和调度器", role: "技术主管 Agent", x: 1080, y: 600, width: 350, height: 350, inputs: ["MODEL", "POSITIVE", "NEGATIVE", "LATENT"], outputs: ["SAMPLES"], parameters: { seed: -1, steps: 28, cfg: 7, sampler: "euler", scheduler: "normal" }, parameterSchema: [{ key: "seed", label: "随机种子", type: "number" }, { key: "steps", label: "采样步数", type: "number", min: 1, max: 150 }, { key: "cfg", label: "提示词引导", type: "number", min: 1, max: 30, step: 0.5 }, { key: "sampler", label: "采样器", type: "select", options: ["euler", "euler_a", "dpmpp_2m", "ddim"] }, { key: "scheduler", label: "调度器", type: "select", options: ["normal", "karras", "exponential", "sgm_uniform"] }] },
    { id: "image-decode", code: "VAE", title: "VAE 解码", subtitle: "把潜空间样本还原为图片", x: 1580, y: 670, inputs: ["SAMPLES", "VAE"], outputs: ["IMAGE"] },
    { id: "image-upscale", code: "UPSCALE", title: "高清放大", subtitle: "按比例放大并增强细节", x: 1970, y: 500, inputs: ["IMAGE"], outputs: ["IMAGE"], parameters: { scale: 1, method: "lanczos" }, parameterSchema: [{ key: "scale", label: "放大倍数", type: "number", min: 1, max: 4, step: 0.5 }, { key: "method", label: "缩放算法", type: "select", options: ["lanczos", "bicubic", "nearest-exact"] }] },
    { id: "image-save", code: "SAVE", title: "保存图片", subtitle: "保存到用户选择的 Agent 产物目录", role: "DevOps Agent", x: 2420, y: 430, inputs: ["IMAGE"], outputs: ["FILE"], parameters: { prefix: "AI-Team" }, parameterSchema: [{ key: "prefix", label: "文件名前缀", type: "text" }] },
    { id: "image-preview", code: "VIEW", title: "图片预览", subtitle: "显示最近一次真实生成结果", x: 2420, y: 760, width: 330, height: 220, inputs: ["IMAGE"], outputs: [] },
    { id: "image-manager", code: "QUEUE", title: "生成队列", subtitle: "校验节点并提交真实生图请求", manager: true, x: 2860, y: 430, width: 300, height: 190, inputs: ["FILE"], outputs: ["RESULT"] }
  ];
  const imageEdges = [
    { from: "image-checkpoint", to: "image-positive", sourcePort: "CLIP", targetPort: "CLIP" }, { from: "image-checkpoint", to: "image-negative", sourcePort: "CLIP", targetPort: "CLIP" },
    { from: "image-checkpoint", to: "image-sampler", sourcePort: "MODEL", targetPort: "MODEL" }, { from: "image-positive", to: "image-sampler", sourcePort: "CONDITIONING", targetPort: "POSITIVE" },
    { from: "image-negative", to: "image-sampler", sourcePort: "CONDITIONING", targetPort: "NEGATIVE" }, { from: "image-latent", to: "image-sampler", sourcePort: "LATENT", targetPort: "LATENT" },
    { from: "image-sampler", to: "image-decode", sourcePort: "SAMPLES", targetPort: "SAMPLES" }, { from: "image-checkpoint", to: "image-decode", sourcePort: "VAE", targetPort: "VAE" },
    { from: "image-decode", to: "image-upscale", sourcePort: "IMAGE", targetPort: "IMAGE" }, { from: "image-upscale", to: "image-save", sourcePort: "IMAGE", targetPort: "IMAGE" },
    { from: "image-upscale", to: "image-preview", sourcePort: "IMAGE", targetPort: "IMAGE" }, { from: "image-save", to: "image-manager", sourcePort: "FILE", targetPort: "FILE" }
  ];

  const videoNodes = [
    { id: "video-model", code: "MODEL", title: "加载视频模型", subtitle: "使用设置中的视频生成模型", x: 120, y: 780, outputs: ["MODEL", "ENCODER"] },
    { id: "video-prompt", code: "TEXT+", title: "视频提示词", subtitle: "描述主体动作、镜头运动、场景和风格", role: "产品经理 Agent", x: 500, y: 250, width: 370, height: 280, inputs: ["ENCODER"], outputs: ["CONDITIONING"], parameters: { prompt: "" }, parameterSchema: [{ key: "prompt", label: "视频提示词", type: "textarea", rows: 8 }] },
    { id: "video-negative", code: "TEXT-", title: "负向提示词", subtitle: "排除闪烁、形变和不稳定运动", x: 500, y: 620, width: 370, height: 230, inputs: ["ENCODER"], outputs: ["CONDITIONING"], parameters: { negativePrompt: "闪烁，抖动，变形，低质量" }, parameterSchema: [{ key: "negativePrompt", label: "排除内容", type: "textarea", rows: 5 }] },
    { id: "video-reference", code: "IMAGE", title: "参考首帧", subtitle: "可选的图生视频参考图", x: 500, y: 1030, inputs: [], outputs: ["IMAGE"], parameters: { path: "" }, parameterSchema: [{ key: "path", label: "参考图路径", type: "text" }] },
    { id: "video-motion", code: "MOTION", title: "运动与镜头", subtitle: "设置时长、画幅和运动强度", x: 940, y: 1010, width: 320, height: 260, inputs: ["IMAGE"], outputs: ["MOTION"], parameters: { duration: 5, ratio: "16:9", motion: 5, fps: 24 }, parameterSchema: [{ key: "duration", label: "时长（秒）", type: "number", min: 1, max: 60 }, { key: "ratio", label: "画幅", type: "select", options: ["16:9", "9:16", "1:1", "4:3"] }, { key: "motion", label: "运动强度", type: "number", min: 1, max: 10 }, { key: "fps", label: "帧率", type: "number", min: 12, max: 60 }] },
    { id: "video-sampler", code: "SAMPLE", title: "视频采样器", subtitle: "提交模型、条件、运动和随机种子", role: "技术主管 Agent", x: 1260, y: 600, width: 360, height: 340, inputs: ["MODEL", "POSITIVE", "NEGATIVE", "MOTION"], outputs: ["LATENT_VIDEO"], parameters: { seed: -1, steps: 30, cfg: 6 }, parameterSchema: [{ key: "seed", label: "随机种子", type: "number" }, { key: "steps", label: "采样步数", type: "number", min: 1, max: 150 }, { key: "cfg", label: "提示词引导", type: "number", min: 1, max: 30, step: 0.5 }] },
    { id: "video-decode", code: "DECODE", title: "视频解码", subtitle: "把模型结果解码为连续画面", x: 1740, y: 660, inputs: ["LATENT_VIDEO"], outputs: ["FRAMES"] },
    { id: "video-interpolate", code: "RIFE", title: "补帧与稳定", subtitle: "提升帧率并减少画面闪烁", x: 2110, y: 520, inputs: ["FRAMES"], outputs: ["FRAMES"], parameters: { multiplier: 2, stabilize: true }, parameterSchema: [{ key: "multiplier", label: "补帧倍数", type: "number", min: 1, max: 4 }, { key: "stabilize", label: "画面稳定", type: "checkbox" }] },
    { id: "video-audio", code: "AUDIO", title: "配音与字幕", subtitle: "可选配音、字幕和音轨合成", role: "后端 Agent", x: 2100, y: 920, width: 330, height: 250, inputs: ["FRAMES"], outputs: ["TIMELINE"], parameters: { subtitles: true, voiceover: false }, parameterSchema: [{ key: "subtitles", label: "生成字幕", type: "checkbox" }, { key: "voiceover", label: "生成配音", type: "checkbox" }] },
    { id: "video-export", code: "EXPORT", title: "导出视频", subtitle: "编码并保存到 Agent 产物目录", role: "DevOps Agent", x: 2550, y: 650, width: 320, height: 260, inputs: ["FRAMES", "TIMELINE"], outputs: ["FILE"], parameters: { format: "mp4", codec: "h264" }, parameterSchema: [{ key: "format", label: "容器", type: "select", options: ["mp4", "webm"] }, { key: "codec", label: "编码", type: "select", options: ["h264", "h265", "vp9"] }] },
    { id: "video-manager", code: "QUEUE", title: "生成队列", subtitle: "校验节点并提交真实视频生成请求", manager: true, x: 2980, y: 650, width: 300, height: 190, inputs: ["FILE"], outputs: ["RESULT"] }
  ];
  const videoEdges = [
    { from: "video-model", to: "video-prompt", sourcePort: "ENCODER", targetPort: "ENCODER" }, { from: "video-model", to: "video-negative", sourcePort: "ENCODER", targetPort: "ENCODER" },
    { from: "video-model", to: "video-sampler", sourcePort: "MODEL", targetPort: "MODEL" }, { from: "video-prompt", to: "video-sampler", sourcePort: "CONDITIONING", targetPort: "POSITIVE" },
    { from: "video-negative", to: "video-sampler", sourcePort: "CONDITIONING", targetPort: "NEGATIVE" }, { from: "video-reference", to: "video-motion", sourcePort: "IMAGE", targetPort: "IMAGE" },
    { from: "video-motion", to: "video-sampler", sourcePort: "MOTION", targetPort: "MOTION" }, { from: "video-sampler", to: "video-decode", sourcePort: "LATENT_VIDEO", targetPort: "LATENT_VIDEO" },
    { from: "video-decode", to: "video-interpolate", sourcePort: "FRAMES", targetPort: "FRAMES" }, { from: "video-interpolate", to: "video-export", sourcePort: "FRAMES", targetPort: "FRAMES" },
    { from: "video-interpolate", to: "video-audio", sourcePort: "FRAMES", targetPort: "FRAMES" }, { from: "video-audio", to: "video-export", sourcePort: "TIMELINE", targetPort: "TIMELINE" },
    { from: "video-export", to: "video-manager", sourcePort: "FILE", targetPort: "FILE" }
  ];

  const templates = {
    software: createSoftwareTemplate(),
    image: createMediaTemplate("image", "生图节点工作流", "端口化生图节点、参数与真实生成队列", imageNodes, imageEdges),
    video: createMediaTemplate("video", "视频节点工作流", "端口化视频节点、运动参数与真实生成队列", videoNodes, videoEdges)
  };

  function selectTask(tasks, selectedId) {
    const list = Array.isArray(tasks) ? tasks : [];
    return list.find((task) => task.id === selectedId)
      || list.find((task) => task.status === "progress")
      || list.find((task) => task.status === "todo")
      || list[0]
      || null;
  }

  function roleStatus(task, role) {
    if (!task) return { state: "idle", detail: "等待经理分派" };
    const runs = Array.isArray(task.runs) ? task.runs : [];
    const run = runs.find((item) => item.delegateTo === role);
    if (run) {
      const failed = run.verification?.passed === false;
      return { state: failed ? "failed" : "done", detail: failed ? "检查未通过" : run.summary || "步骤已完成", run };
    }
    if (task.status === "progress" && task.agent === role) return { state: "active", detail: "正在执行经理分派的任务" };
    if (task.status === "todo" && task.agent === role) return { state: "queued", detail: "已进入经理调度队列" };
    return { state: "idle", detail: "当前任务尚未派发到这里" };
  }

  function managerStatus(task) {
    if (!task) return { state: "idle", detail: "等待任务" };
    if (task.error || task.verification?.passed === false) return { state: "failed", detail: "验收未通过，任务已退回" };
    if (task.status === "done") return { state: "done", detail: `已汇总 ${task.runs?.length || 0} 个 Agent 步骤` };
    return { state: task.status === "progress" ? "active" : "queued", detail: task.status === "progress" ? "正在向 Agent 派发任务" : "等待接管并拆解任务" };
  }

  function build(tasks, selectedId, mode = "software") {
    const template = templates[mode] || templates.software;
    const task = selectTask(tasks, selectedId);
    const resolved = [];
    const byId = {};
    for (const node of template.nodes) {
      let status;
      if (template.id !== "software") status = { state: "idle", detail: node.subtitle };
      else if (node.manager) status = managerStatus(task);
      else if (node.role) status = roleStatus(task, node.role);
      else status = { state: "idle", detail: "等待任务" };
      const next = { ...node, ...status };
      resolved.push(next);
      byId[next.id] = next;
    }
    for (const node of resolved.filter((item) => item.sourceNode)) {
      const source = byId[node.sourceNode];
      node.state = source?.state || "idle";
      node.run = source?.run;
      node.detail = source?.state === "done" ? `${node.title}已有可审计结果` : source?.detail || "等待上游 Agent";
    }
    const edges = template.edges.map((edge) => {
      const source = byId[edge.from];
      const target = byId[edge.to];
      const state = target?.state === "failed" ? "failed" : ["active", "done"].includes(target?.state) && source?.state !== "idle" ? "active" : "idle";
      return { ...edge, state };
    });
    const completed = resolved.filter((node) => node.state === "done").length;
    return {
      mode: template.id, template, task, nodes: resolved, edges,
      summary: {
        completed,
        active: resolved.filter((node) => node.state === "active").length,
        failed: resolved.filter((node) => node.state === "failed").length,
        progress: task ? (task.status === "done" && !task.error ? 100 : Math.round((completed / resolved.length) * 100)) : 0,
        artifacts: task?.artifacts?.length || 0
      }
    };
  }

  function templateList() {
    return Object.values(templates).map(({ id, name, description, nodes, edges }) => ({ id, name, description, nodeCount: nodes.length, edgeCount: edges.length }));
  }

  return Object.freeze({ build, selectTask, templateList, templates });
}));
