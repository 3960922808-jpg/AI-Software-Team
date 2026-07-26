"""AI Software Team Windows desktop application.

Run with: python desktop_app.py
"""

from __future__ import annotations

import json
import os
import tkinter as tk
from pathlib import Path
from tkinter import messagebox, ttk


APP_DIR = Path(os.environ.get("APPDATA", Path.home())) / "AI Software Team"
DATA_FILE = APP_DIR / "workspace.json"
DEFAULT_TASKS = [
    {"title": "梳理 MVP 用户需求", "agent": "产品经理 Agent", "priority": "高", "status": "待处理", "description": "明确首批用户场景和验收条件。"},
    {"title": "定义任务编排领域模型", "agent": "架构师 Agent", "priority": "高", "status": "进行中", "description": "建立任务、Agent 与执行记录的基础契约。"},
    {"title": "创建项目工作台原型", "agent": "前端 Agent", "priority": "中", "status": "已完成", "description": "完成任务流与 Agent 分派界面。"},
]
AGENTS = {
    "指挥 Agent": ["任务分解", "Agent 路由", "结果汇总"],
    "产品经理 Agent": ["需求分析", "PRD 生成", "优先级规划"],
    "架构师 Agent": ["架构设计", "技术选型", "接口契约"],
    "技术主管 Agent": ["代码评审", "实施规划", "风险识别"],
    "前端 Agent": ["界面实现", "组件设计", "体验验证"],
    "后端 Agent": ["API 设计", "数据建模", "服务集成"],
    "测试 Agent": ["测试设计", "自动化测试", "质量报告"],
    "安全专家 Agent": ["威胁建模", "依赖审查", "安全验收"],
    "DevOps Agent": ["构建流水线", "部署编排", "运行监控"],
}
SPECIALIST_AGENTS = [agent for agent in AGENTS if agent != "指挥 Agent"]


class App(tk.Tk):
    def __init__(self) -> None:
        super().__init__()
        self.title("AI Software Team")
        self.geometry("1180x760")
        self.minsize(980, 650)
        self.configure(bg="#f4f7f8")
        self.tasks = self.load_tasks()
        self.api_key = ""  # Deliberately never persisted to disk.
        self.skill_state = {skill: True for skills in AGENTS.values() for skill in skills}
        self.events = ["Windows 桌面客户端已启动", "指挥 Agent 已就绪", "等待任务进入调度队列"]
        self.frames: dict[str, ttk.Frame] = {}
        self.setup_style()
        self.build_shell()
        self.show_page("projects")

    def setup_style(self) -> None:
        style = ttk.Style(self)
        style.theme_use("clam")
        style.configure("TFrame", background="#f4f7f8")
        style.configure("Card.TFrame", background="#ffffff")
        style.configure("Title.TLabel", background="#f4f7f8", foreground="#17212b", font=("Microsoft YaHei", 20, "bold"))
        style.configure("Muted.TLabel", background="#f4f7f8", foreground="#637181", font=("Microsoft YaHei", 9))
        style.configure("Card.TLabel", background="#ffffff", foreground="#17212b", font=("Microsoft YaHei", 10))
        style.configure("TButton", font=("Microsoft YaHei", 10), padding=(10, 6))
        style.configure("Primary.TButton", background="#1269c7", foreground="#ffffff")
        style.map("Primary.TButton", background=[("active", "#0c579f")])
        style.configure("Treeview", rowheight=30, font=("Microsoft YaHei", 9), background="#ffffff", fieldbackground="#ffffff")
        style.configure("Treeview.Heading", font=("Microsoft YaHei", 9, "bold"), background="#eaf0f3")

    def load_tasks(self) -> list[dict]:
        try:
            return json.loads(DATA_FILE.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            return [task.copy() for task in DEFAULT_TASKS]

    def save_tasks(self) -> None:
        APP_DIR.mkdir(parents=True, exist_ok=True)
        DATA_FILE.write_text(json.dumps(self.tasks, ensure_ascii=False, indent=2), encoding="utf-8")

    def build_shell(self) -> None:
        shell = ttk.Frame(self)
        shell.pack(fill="both", expand=True)
        sidebar = tk.Frame(shell, bg="#152b3b", width=220)
        sidebar.pack(side="left", fill="y")
        sidebar.pack_propagate(False)
        tk.Label(sidebar, text="AI\nSoftware Team", justify="left", bg="#152b3b", fg="#ffffff", font=("Microsoft YaHei", 17, "bold")).pack(anchor="w", padx=22, pady=(26, 28))
        for key, label in [("projects", "项目工作台"), ("orchestrator", "智能调度中心"), ("settings", "模型与 API"), ("skills", "技能中心")]:
            tk.Button(sidebar, text=label, command=lambda value=key: self.show_page(value), anchor="w", relief="flat", bd=0, bg="#152b3b", activebackground="#284556", fg="#dbe8ee", activeforeground="#ffffff", font=("Microsoft YaHei", 10), padx=22, pady=11).pack(fill="x")
        tk.Label(sidebar, text="● 指挥 Agent 在线", bg="#152b3b", fg="#69d0c3", font=("Microsoft YaHei", 9)).pack(side="bottom", anchor="w", padx=22, pady=24)
        self.content = ttk.Frame(shell, padding=30)
        self.content.pack(side="left", fill="both", expand=True)
        self.build_projects()
        self.build_orchestrator()
        self.build_settings()
        self.build_skills()

    def add_header(self, frame: ttk.Frame, eyebrow: str, title: str) -> ttk.Frame:
        header = ttk.Frame(frame)
        header.pack(fill="x", pady=(0, 22))
        ttk.Label(header, text=eyebrow, style="Muted.TLabel").pack(anchor="w")
        ttk.Label(header, text=title, style="Title.TLabel").pack(anchor="w")
        return header

    def build_projects(self) -> None:
        frame = ttk.Frame(self.content)
        self.frames["projects"] = frame
        header = self.add_header(frame, "AI 项目经理", "项目工作台")
        ttk.Button(header, text="新建任务", style="Primary.TButton", command=self.new_task).pack(side="right", anchor="e")
        summary = ttk.Frame(frame, style="Card.TFrame", padding=18)
        summary.pack(fill="x", pady=(0, 18))
        ttk.Label(summary, text="AI Software Team 平台", style="Card.TLabel", font=("Microsoft YaHei", 13, "bold")).pack(anchor="w")
        ttk.Label(summary, text="从需求分析到部署交付的多 Agent 软件研发流程。", style="Card.TLabel", foreground="#637181").pack(anchor="w", pady=(8, 0))
        self.metrics_label = ttk.Label(summary, style="Card.TLabel")
        self.metrics_label.pack(anchor="w", pady=(12, 0))
        board = ttk.Frame(frame)
        board.pack(fill="both", expand=True)
        self.task_trees = {}
        for index, status in enumerate(["待处理", "进行中", "已完成"]):
            column = ttk.Frame(board, style="Card.TFrame", padding=12)
            column.grid(row=0, column=index, sticky="nsew", padx=(0, 10) if index < 2 else 0)
            board.columnconfigure(index, weight=1)
            ttk.Label(column, text=status, style="Card.TLabel", font=("Microsoft YaHei", 11, "bold")).pack(anchor="w", pady=(0, 8))
            tree = ttk.Treeview(column, columns=("agent", "priority"), show="headings", height=14)
            tree.heading("agent", text="负责 Agent"); tree.heading("priority", text="优先级")
            tree.column("agent", width=140); tree.column("priority", width=58, anchor="center")
            tree.pack(fill="both", expand=True)
            self.task_trees[status] = tree
            controls = ttk.Frame(column, style="Card.TFrame")
            controls.pack(fill="x", pady=(10, 0))
            if status != "待处理": ttk.Button(controls, text="上一步", command=lambda value=status: self.move_task(value, -1)).pack(side="left")
            if status != "已完成": ttk.Button(controls, text="下一步", command=lambda value=status: self.move_task(value, 1)).pack(side="right")
        self.refresh_projects()

    def refresh_projects(self) -> None:
        counts = {status: len([task for task in self.tasks if task["status"] == status]) for status in self.task_trees}
        self.metrics_label.configure(text=f"待处理 {counts['待处理']}  |  进行中 {counts['进行中']}  |  已完成 {counts['已完成']}  |  总任务 {len(self.tasks)}")
        for status, tree in self.task_trees.items():
            tree.delete(*tree.get_children())
            for index, task in enumerate(self.tasks):
                if task["status"] == status: tree.insert("", "end", iid=str(index), values=(task["agent"], task["priority"]), text=task["title"])
        if "orchestrator" in self.frames: self.refresh_orchestrator()

    def selected_task(self, status: str) -> int | None:
        chosen = self.task_trees[status].selection()
        if not chosen:
            messagebox.showinfo("选择任务", "请先在当前列选择一项任务。", parent=self)
            return None
        return int(chosen[0])

    def move_task(self, status: str, direction: int) -> None:
        index = self.selected_task(status)
        if index is None: return
        statuses = ["待处理", "进行中", "已完成"]
        task = self.tasks[index]
        task["status"] = statuses[statuses.index(status) + direction]
        self.events.insert(0, f"{task['agent']} 的任务“{task['title']}”已移至{task['status']}")
        self.save_tasks(); self.refresh_projects()

    def new_task(self) -> None:
        dialog = tk.Toplevel(self); dialog.title("新建任务"); dialog.transient(self); dialog.grab_set(); dialog.resizable(False, False)
        body = ttk.Frame(dialog, padding=22); body.pack(fill="both", expand=True)
        fields = {"任务名称": tk.StringVar(), "负责 Agent": tk.StringVar(value=SPECIALIST_AGENTS[0]), "优先级": tk.StringVar(value="中"), "任务说明": tk.StringVar()}
        for label, variable in fields.items():
            ttk.Label(body, text=label).pack(anchor="w", pady=(8, 3))
            if label == "负责 Agent": ttk.Combobox(body, textvariable=variable, values=SPECIALIST_AGENTS, state="readonly", width=42).pack()
            elif label == "优先级": ttk.Combobox(body, textvariable=variable, values=["高", "中", "低"], state="readonly", width=42).pack()
            else: ttk.Entry(body, textvariable=variable, width=45).pack()
        def create() -> None:
            if not fields["任务名称"].get().strip(): messagebox.showwarning("缺少任务名称", "请输入任务名称。", parent=dialog); return
            self.tasks.insert(0, {"title": fields["任务名称"].get().strip(), "agent": fields["负责 Agent"].get(), "priority": fields["优先级"].get(), "status": "待处理", "description": fields["任务说明"].get().strip()})
            self.events.insert(0, f"指挥 Agent 已接收新任务“{fields['任务名称'].get().strip()}”")
            self.save_tasks(); self.refresh_projects(); dialog.destroy()
        ttk.Button(body, text="创建任务", style="Primary.TButton", command=create).pack(anchor="e", pady=(20, 0))

    def build_orchestrator(self) -> None:
        frame = ttk.Frame(self.content); self.frames["orchestrator"] = frame
        header = self.add_header(frame, "Agent Orchestrator", "智能调度中心")
        ttk.Button(header, text="运行下一任务", style="Primary.TButton", command=self.run_next).pack(side="right", anchor="e")
        top = ttk.Frame(frame); top.pack(fill="both", expand=True)
        queue_card = ttk.Frame(top, style="Card.TFrame", padding=16); queue_card.pack(side="left", fill="both", expand=True, padx=(0, 10))
        ttk.Label(queue_card, text="任务执行队列", style="Card.TLabel", font=("Microsoft YaHei", 12, "bold")).pack(anchor="w", pady=(0, 10))
        self.queue_tree = ttk.Treeview(queue_card, columns=("status", "agent", "priority"), show="headings", height=14)
        for key, title, width in [("status", "状态", 70), ("agent", "执行 Agent", 145), ("priority", "优先级", 65)]: self.queue_tree.heading(key, text=title); self.queue_tree.column(key, width=width)
        self.queue_tree.pack(fill="both", expand=True)
        agent_card = ttk.Frame(top, style="Card.TFrame", padding=16); agent_card.pack(side="left", fill="both", expand=True)
        ttk.Label(agent_card, text="专业 Agent 注册表", style="Card.TLabel", font=("Microsoft YaHei", 12, "bold")).pack(anchor="w", pady=(0, 10))
        self.agent_tree = ttk.Treeview(agent_card, columns=("state",), show="headings", height=14)
        self.agent_tree.heading("state", text="状态"); self.agent_tree.column("state", width=100)
        self.agent_tree.pack(fill="both", expand=True)
        event_card = ttk.Frame(frame, style="Card.TFrame", padding=16); event_card.pack(fill="x", pady=(16, 0))
        ttk.Label(event_card, text="调度事件", style="Card.TLabel", font=("Microsoft YaHei", 12, "bold")).pack(anchor="w")
        self.event_list = tk.Listbox(event_card, height=5, bd=0, highlightthickness=0, font=("Microsoft YaHei", 9), bg="#ffffff", fg="#405766")
        self.event_list.pack(fill="x", pady=(8, 0))

    def refresh_orchestrator(self) -> None:
        if not hasattr(self, "queue_tree"): return
        self.queue_tree.delete(*self.queue_tree.get_children()); self.agent_tree.delete(*self.agent_tree.get_children()); self.event_list.delete(0, "end")
        active = {task["agent"] for task in self.tasks if task["status"] == "进行中"}
        for index, task in enumerate(self.tasks):
            if task["status"] != "已完成": self.queue_tree.insert("", "end", iid=str(index), values=(task["status"], task["agent"], task["priority"]), text=task["title"])
        for agent in SPECIALIST_AGENTS: self.agent_tree.insert("", "end", text=agent, values=("执行中" if agent in active else "可调度",))
        for event in self.events[:5]: self.event_list.insert("end", event)

    def run_next(self) -> None:
        for task in self.tasks:
            if task["status"] == "待处理":
                task["status"] = "进行中"; self.events.insert(0, f"指挥 Agent 已将“{task['title']}”分派给 {task['agent']}")
                self.save_tasks(); self.refresh_projects(); return
        messagebox.showinfo("调度中心", "没有待处理的任务可以启动。", parent=self)

    def build_settings(self) -> None:
        frame = ttk.Frame(self.content); self.frames["settings"] = frame
        self.add_header(frame, "Model Layer", "模型与 API 配置")
        card = ttk.Frame(frame, style="Card.TFrame", padding=22); card.pack(fill="x")
        ttk.Label(card, text="主模型连接", style="Card.TLabel", font=("Microsoft YaHei", 12, "bold")).grid(row=0, column=0, columnspan=2, sticky="w", pady=(0, 12))
        self.provider = tk.StringVar(value="OpenAI"); self.base_url = tk.StringVar(value="https://api.openai.com/v1"); self.model_name = tk.StringVar(value="gpt-4.1-mini"); self.routing = tk.StringVar(value="均衡分派")
        configs = [("模型提供商", self.provider, ["OpenAI", "Anthropic", "Google AI", "DeepSeek", "兼容 OpenAI 的自定义服务"]), ("API Base URL", self.base_url, None), ("模型名称", self.model_name, None), ("调度策略", self.routing, ["均衡分派", "质量优先", "速度优先"])]
        for row, (label, variable, choices) in enumerate(configs, 1):
            ttk.Label(card, text=label).grid(row=row, column=0, sticky="w", padx=(0, 18), pady=7)
            widget = ttk.Combobox(card, textvariable=variable, values=choices, state="readonly", width=48) if choices else ttk.Entry(card, textvariable=variable, width=51)
            widget.grid(row=row, column=1, sticky="w", pady=7)
        ttk.Label(card, text="API Key（仅本次运行）").grid(row=5, column=0, sticky="w", pady=7)
        self.api_entry = ttk.Entry(card, show="•", width=51); self.api_entry.grid(row=5, column=1, sticky="w", pady=7)
        ttk.Label(card, text="密钥不会保存到磁盘、发布包或 Git 仓库。生产版应将密钥交由后端密钥管理服务保存。", style="Card.TLabel", foreground="#637181", wraplength=620).grid(row=6, column=0, columnspan=2, sticky="w", pady=(12, 4))
        ttk.Button(card, text="保存本次运行配置", style="Primary.TButton", command=self.save_runtime_config).grid(row=7, column=1, sticky="e", pady=(16, 0))

    def save_runtime_config(self) -> None:
        self.api_key = self.api_entry.get().strip()
        self.events.insert(0, f"指挥 Agent 已采用 {self.model_name.get()} 与{self.routing.get()}策略")
        self.refresh_orchestrator(); messagebox.showinfo("模型配置", "连接配置已应用于当前运行会话。API Key 不会写入磁盘。", parent=self)

    def build_skills(self) -> None:
        frame = ttk.Frame(self.content); self.frames["skills"] = frame
        self.add_header(frame, "Skill System", "Agent 技能中心")
        ttk.Label(frame, text="指挥 Agent 仅负责拆解与路由；每一个专业 Agent 只能使用本页启用的专属技能。", style="Muted.TLabel").pack(anchor="w", pady=(0, 15))
        canvas = tk.Canvas(frame, bg="#f4f7f8", highlightthickness=0); scrollbar = ttk.Scrollbar(frame, orient="vertical", command=canvas.yview); body = ttk.Frame(canvas)
        body.bind("<Configure>", lambda _: canvas.configure(scrollregion=canvas.bbox("all"))); canvas.create_window((0, 0), window=body, anchor="nw"); canvas.configure(yscrollcommand=scrollbar.set)
        canvas.pack(side="left", fill="both", expand=True); scrollbar.pack(side="right", fill="y")
        for index, (agent, skills) in enumerate(AGENTS.items()):
            card = ttk.Frame(body, style="Card.TFrame", padding=14); card.grid(row=index // 2, column=index % 2, sticky="nsew", padx=(0, 12) if index % 2 == 0 else 0, pady=(0, 12)); body.columnconfigure(index % 2, weight=1)
            ttk.Label(card, text=agent, style="Card.TLabel", font=("Microsoft YaHei", 11, "bold")).pack(anchor="w", pady=(0, 8))
            for skill in skills:
                var = tk.BooleanVar(value=True); var.trace_add("write", lambda *_args, name=skill, value=var: self.skill_state.__setitem__(name, value.get()))
                ttk.Checkbutton(card, text=skill, variable=var).pack(anchor="w", pady=3)

    def show_page(self, name: str) -> None:
        for frame in self.frames.values(): frame.pack_forget()
        self.frames[name].pack(fill="both", expand=True)
        if name == "projects": self.refresh_projects()
        if name == "orchestrator": self.refresh_orchestrator()


if __name__ == "__main__":
    App().mainloop()
