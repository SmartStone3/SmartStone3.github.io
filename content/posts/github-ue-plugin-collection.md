---
title: "GitHub上的UE插件收藏整理"
date: 2026-04-04T12:00:00+08:00
draft: false
slug: "github-ue-plugin-collection"
tags: ["Unreal Engine", "Plugins", "GitHub", "收藏"]
featured: true
---

# GitHub上的UE插件收藏整理

> 本文整理自 GitHub 仓库，涵盖 Unreal Plugin、Unreal Basic Plugins、Unreal Doc、AI、Pipeline、Blender、Doc、Net、Assets、Python、Unity、Godot、Wwise 等分类，按功能领域进行介绍。

---

## 目录

- [🎮 Gameplay 系统](#-gameplay-系统)
  - [任务系统](#任务系统)
  - [对话系统](#对话系统)
  - [交互系统](#交互系统)
  - [物品与背包系统](#物品与背包系统)
  - [AI 决策系统](#ai-决策系统)
  - [感知与目标系统](#感知与目标系统)
  - [卡牌与回合制](#卡牌与回合制)
  - [其他 Gameplay 系统](#其他-gameplay-系统)
- [🏃 角色移动与动画](#-角色移动与动画)
  - [角色移动](#角色移动)
  - [动画与骨骼](#动画与骨骼)
  - [受击与肢解](#受击与肢解)
- [🧭 导航与寻路](#-导航与寻路)
- [🌐 网络与多人游戏](#-网络与多人游戏)
  - [网络框架与复制](#网络框架与复制)
  - [在线服务](#在线服务)
  - [REST & 数据通信](#rest--数据通信)
- [🖥️ UI 系统](#️-ui-系统)
- [🔧 编辑器工具](#-编辑器工具)
  - [通用编辑器扩展](#通用编辑器扩展)
  - [属性与元数据编辑](#属性与元数据编辑)
  - [资源管理与烘焙](#资源管理与烘焙)
- [🌍 PCG 与程序化生成](#-pcg-与程序化生成)
- [⚡ 物理与模拟](#-物理与模拟)
- [🎨 渲染与视觉效果](#-渲染与视觉效果)
  - [粒子与特效](#粒子与特效)
  - [体积云与光照](#体积云与光照)
  - [材质与贴图](#材质与贴图)
  - [LOD 与 Impostor](#lod与impostor)
- [🚀 性能优化](#-性能优化)
  - [PSO 与着色器优化](#pso-与着色器优化)
  - [帧率与负载管理](#帧率与负载管理)
  - [Tick 与定时器优化](#tick-与定时器优化)
  - [项目精简与分析](#项目精简与分析)
- [💻 编程语言扩展](#-编程语言扩展)
- [🎲 ECS 框架](#-ecs-框架)
- [🗺️ 地形与环境](#️-地形与环境)
- [🔫 战斗与射击](#-战斗与射击)
- [🎵 音频](#-音频)
- [🏗️ 关卡设计](#️-关卡设计)
- [📦 数据管理与工具库](#-数据管理与工具库)
- [💾 存档系统](#-存档系统)
- [🔄 对象池](#-对象池)
- [🌏 本地化](#-本地化)
- [🎬 媒体](#-媒体)
- [📐 几何与 Mesh](#-几何与-mesh)
- [🔨 构建与管线工具](#-构建与管线工具)
- [🤖 AI 辅助开发](#-ai-辅助开发)
- [🔗 DCC 桥接工具](#-dcc-桥接工具)
- [📚 文档与学习资源](#-文档与学习资源)
- [🎯 游戏框架与模板](#-游戏框架与模板)
- [🎮 输入系统](#-输入系统)
- [📷 相机系统](#-相机系统)
- [🧩 C++ 协程 (Coroutines)](#-c-协程-coroutines)
- [🤖 AI 与大模型工具 (AI & LLM Tools)](#-ai-与大模型工具-ai--llm-tools)
- [🎨 Blender 插件 (Blender Addons)](#-blender-插件-blender-addons)
- [🌐 网络框架与库 (Networking Libraries)](#-网络框架与库-networking-libraries)
- [🎮 Unity 相关 (Unity Related)](#-unity-相关-unity-related)
- [🛠️ 通用管线与协作工具 (General Pipeline & Collaboration)](#️-通用管线与协作工具-general-pipeline--collaboration)
- [🐍 Python 工具库 (Python Libraries)](#-python-工具库-python-libraries)
- [🎯 游戏资源 (Game Assets)](#-游戏资源-game-assets)
- [📚 学习文档与教程 (Learning Docs & Tutorials)](#-学习文档与教程-learning-docs--tutorials)
- [⚙️ 游戏引擎与底层库 (Game Engines & Core Libraries)](#️-游戏引擎与底层库-game-engines--core-libraries)
- [🔧 通用开发工具 (General Development Tools)](#-通用开发工具-general-development-tools)

---

## 🎮 Gameplay 系统

### 任务系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [sinbad/SUQS](https://github.com/sinbad/SUQS) | ⭐166 | **Steve's Unreal Quest System** — 数据驱动的任务系统，支持通过配置数据来定义任务逻辑，适合需要灵活任务管理的项目。 |
| [Lazy-Jason/LazyNerveQuest](https://github.com/Lazy-Jason/LazyNerveQuest) | ⭐26 | **LazyNerveQuest** — 功能全面的任务管理系统，支持可视化图形编辑器、模块化目标设计、动态UI以及完整的 Blueprint/C++ 支持。 |

### 对话系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [Mountea-Framework/MounteaDialogueSystem](https://github.com/Mountea-Framework/MounteaDialogueSystem) | ⭐358 | **Mountea Dialogue System** — 开源的对话系统，提供专属的对话树编辑器和验证系统，不仅适用于复杂对话场景。 |
| [janikowski-dev/Chronicle](https://github.com/janikowski-dev/Chronicle) | ⭐43 | **Chronicle** — 叙事驱动的游戏工具包，包含对话图表、自定义规则、角色管理、任务系统和过场动画时间线。 |

### 交互系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [Mountea-Framework/MounteaInteractionSystem](https://github.com/Mountea-Framework/MounteaInteractionSystem) | ⭐113 | **Mountea Interaction System** — 基于组件的 Actor 智能交互系统，面向设计师友好，支持高可扩展性。 |
| [Lim-Young/GameplayInputSystem](https://github.com/Lim-Young/GameplayInputSystem) | ⭐15 | **GameplayInputSystem** — 基于 GameplayTag 的全局输入监听系统，集成交互模块，支持 QTE 等自定义交互事件的创建和管理。 |

### 物品与背包系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [mattyman174/GenericItemization](https://github.com/mattyman174/GenericItemization) | ⭐170 | **GenericItemization** — 灵活的物品系统插件，利用 DataTable 和 Instanced Structs 提供通用的物品和词缀生成功能。 |
| [bohdon/GameItemsPlugin](https://github.com/bohdon/GameItemsPlugin) | ⭐82 | **GameItemsPlugin** — 提供创建游戏物品、背包和装备系统的类和工具。 |

### AI 决策系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [sinbad/SUSS](https://github.com/sinbad/SUSS) | ⭐68 | **Steve's UtilityAI SubSystem** — UE5 的效用 AI 子系统，支持通过效用评分来驱动 AI 行为决策。 |
| [hollsteinm/ReasonablePlanningAI](https://github.com/hollsteinm/ReasonablePlanningAI) | ⭐163 | **ReasonablePlanningAI** — 设计师驱动的 AI 模块扩展插件，支持数据驱动的效用 AI 和目标导向行动规划（GOAP）。 |
| [Lim-Young/UnrealAITokenSystem](https://github.com/Lim-Young/UnrealAITokenSystem) | ⭐21 | **UnrealAITokenSystem** — 受 DOOM 启发的 AI Token 系统，用于管理多敌人战斗体验中的攻击资源分配。 |
| [Lim-Young/UnrealBehaviorTreeExtension](https://github.com/Lim-Young/UnrealBehaviorTreeExtension) | ⭐1 | **UnrealBehaviorTreeExtension** — UE 行为树扩展，新增状态机选择器（State Machine Selector）和效用选择器（Utility Selector）。 |

### 感知与目标系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [Sn-a-ke/SenseSystem](https://github.com/Sn-a-ke/SenseSystem) | ⭐19 | **SenseSystem** — 灵活、可扩展的多功能感知系统，用于检测和响应游戏对象。 |
| [Lim-Young/TargetTraceSystem](https://github.com/Lim-Young/TargetTraceSystem) | ⭐9 | **TargetTraceSystem** — 通用目标追踪系统，可集中管理各种目标追踪需求，特别适合敌人 AI 系统。 |
| [Vaei/Vigil](https://github.com/Vaei/Vigil) | ⭐55 | **Vigil** — 游戏聚焦系统，支持数据驱动、异步处理和可选的网络预测。 |

### 卡牌与回合制

| 插件 | Stars | 简介 |
|------|-------|------|
| [Kodingroo/K_Cards-Game-Feature](https://github.com/Kodingroo/K_Cards-Game-Feature) | ⭐4 | **K_Cards** — UE 5.2 卡牌游戏框架，使用 C++ 和蓝图实现，包含回合制逻辑、AI 行为、玩家状态管理和 GAS 集成。 |

### 其他 Gameplay 系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [gerlogu/CustomInGameConsole](https://github.com/gerlogu/CustomInGameConsole) | ⭐39 | **CustomInGameConsole** — 可在 Release 版本中轻松创建自定义控制台命令的工具。 |
| [gamedevware/charon](https://github.com/gamedevware/charon) | ⭐82 | **Charon** — 强大的游戏数据管理工具，提供结构化的游戏数据设计和自动源码生成，支持 UE 集成。 |
| [GGgRain/Unreal-Joint](https://github.com/GGgRain/Unreal-Joint) | ⭐84 | **Unreal-Joint** — 通用模块化播放框架（Epic MegaGrants 获奖项目），适用于多种回放/过场场景。 |
| [Lim-Young/GameFeedbackCrafter](https://github.com/Lim-Young/GameFeedbackCrafter) | ⭐3 | **GameFeedbackCrafter** — UE 模块化游戏反馈创建器，用于组合和管理各类游戏反馈效果。 |
| [oivio/Lyra-Geometry-Tools-Plugin](https://github.com/oivio/Lyra-Geometry-Tools-Plugin) | ⭐4 | **Lyra-Geometry-Tools-Plugin** — 从 Lyra 项目中提取的几何工具插件。 |

---

## 🏃 角色移动与动画

### 角色移动

| 插件 | Stars | 简介 |
|------|-------|------|
| [ProjectBorealis/PBCharacterMovement](https://github.com/ProjectBorealis/PBCharacterMovement) | ⭐1443 | **PBCharacterMovement** — 半条命2风格的经典 FPS 移动组件，用 C++ 实现。 |
| [ShadowfallStudios/ALS-Community](https://github.com/ShadowfallStudios/ALS-Community) | ⭐— | **ALS-Community** — 社区维护的高级运动系统 V4，针对 UE 5.4 进行了复制优化，附带额外功能和 Bug 修复。 |
| [Vaei/PredictedMovement](https://github.com/Vaei/PredictedMovement) | ⭐220 | **PredictedMovement** — 扩展角色移动组件（CMC），增加对预测能力的支持。 |
| [Reddy-dev/SMN2](https://github.com/Reddy-dev/SMN2) | ⭐113 | **SMN2** — 在 UE5 蓝图中轻松实现角色移动网络预测。 |
| [lootera89/LedgeDetection](https://github.com/lootera89/LedgeDetection) | ⭐17 | **LedgeDetection** — 简单、高效的边缘检测系统，自动检测前方边缘并阻止玩家坠落，支持 UE 5.3+。 |
| [Sixze/ALS-Refactored](https://github.com/Sixze/ALS-Refactored) | ⭐1340 | **ALS-Refactored** — 完全重写并改进的 C++ 版高级运动系统 V4（Advanced Locomotion System）。 |
| [BanMing/LyraALS](https://github.com/BanMing/LyraALS) | ⭐7 | **LyraALS** — 基于 Lyra 框架的高级运动系统（ALS）实现。 |
| [HoussineMehnik/TraversalNavigationDataPlugin](https://github.com/HoussineMehnik/TraversalNavigationDataPlugin) | ⭐48 | **TraversalNavigationDataPlugin** — UE5 穿越导航数据插件，用于生成、存储和查询穿越路段数据。 |

### 动画与骨骼

| 插件 | Stars | 简介 |
|------|-------|------|
| [Vaei/TurnInPlace](https://github.com/Vaei/TurnInPlace) | ⭐236 | **TurnInPlace** — 基于 Actor 的原地转身解决方案，替代基于 Mesh 的方案，避免了大量已知问题。 |
| [pafuhana1213/UE5_NewAnimSystemsSample](https://github.com/pafuhana1213/UE5_NewAnimSystemsSample) | ⭐60 | **UE5_NewAnimSystemsSample** — UE5 动画新特性示例项目，主要展示运动系统（Locomotion）相关功能。 |
| [Lim-Young/AnimEventSystem](https://github.com/Lim-Young/AnimEventSystem) | ⭐5 | **AnimEventSystem** — 轻量级动画事件系统，解耦动画与蓝图逻辑层之间的通信。 |
| [Lim-Young/MorphsPlayer](https://github.com/Lim-Young/MorphsPlayer) | ⭐6 | **MorphsPlayer** — 开源插件，新增 Notify State 用于在动画中播放 MorphTarget 变形动画，支持 UE 5.4。 |

### 受击与肢解

| 插件 | Stars | 简介 |
|------|-------|------|
| [Vaei/ProcHitReact](https://github.com/Vaei/ProcHitReact) | ⭐135 | **ProcHitReact** — 程序化物理驱动的骨骼网格体受击反应系统，功能强大，满足各种受击效果需求。 |
| [Thyke/Dismemberment](https://github.com/Thyke/Dismemberment) | ⭐11 | **Dismemberment** — 高级肢解系统，支持动态肢体分离、武器掉落和可自定义的身体部位数据。 |
| [Lim-Young/SkeletalMeshDestruction](https://github.com/Lim-Young/SkeletalMeshDestruction) | ⭐18 | **SkeletalMeshDestruction** — 骨骼网格体退化与肢解系统，支持动态的模型损坏和分离效果。 |

---

## 🧭 导航与寻路

| 插件 | Stars | 简介 |
|------|-------|------|
| [midgen/uesvon](https://github.com/midgen/uesvon) | ⭐255 | **UE-SVon** — 3D 导航网格生成和寻路插件，支持三维空间的导航。 |
| [darbycostello/Nav3D](https://github.com/darbycostello/Nav3D) | ⭐214 | **Nav3D** — 基于稀疏体素八叉树的 3D 寻路系统，针对 UE5 全面优化，支持战术推理。 |
| [midgen/AeonixNavigation](https://github.com/midgen/AeonixNavigation) | ⭐36 | **AeonixNavigation** — 3D SVO（稀疏体素八叉树）导航、寻路和移动插件。 |
| [cem-akkaya/MGDynamicNavigation](https://github.com/cem-akkaya/MGDynamicNavigation) | ⭐13 | **MGDynamicNavigation** — 轻量级的独立本地动态导航系统。 |
| [TheEmidee/UESVONavigation](https://github.com/TheEmidee/UESVONavigation) | ⭐50 | **UESVONavigation** — 基于稀疏体素八叉树（SVO）的 UE4 3D 空间导航插件。 |
| [GunfireGames/Gunfire3DNavigation](https://github.com/GunfireGames/Gunfire3DNavigation) | ⭐18 | **Gunfire3DNavigation** — 完整的 UE5 3D 导航系统，支持全方位三维寻路。 |

---

## 🌐 网络与多人游戏

### 网络框架与复制

| 插件 | Stars | 简介 |
|------|-------|------|
| [sha3sha3/UE-DSSPlugin](https://github.com/sha3sha3/UE-DSSPlugin) | ⭐95 | **UE-DSSPlugin** — 可扩展的 MMO 服务器实例化、副本实例化和玩家负载均衡子系统。 |
| [SJOEC/LobbyManager](https://github.com/SJOEC/LobbyManager) | ⭐19 | **LobbyManager** — 事件驱动的多人游戏会话子系统，支持 C++ 和蓝图。 |
| [YyepPo/UE5-NetDormancy-Demo](https://github.com/YyepPo/UE5-NetDormancy-Demo) | ⭐6 | **UE5-NetDormancy-Demo** — 展示网络休眠（Net Dormancy）优化网络复制的示例项目。 |
| [cem-akkaya/NetworkedPhysics](https://github.com/cem-akkaya/NetworkedPhysics) | ⭐14 | **NetworkedPhysics** — UE 5.7 网络化物理 Pawn 教程项目。 |
| [Cutter-H/ReplicatedDrawingWidgetPlugin](https://github.com/Cutter-H/ReplicatedDrawingWidgetPlugin) | ⭐9 | **ReplicatedDrawingWidgetPlugin** — 多人游戏中可复制的绘图控件插件，支持拖拽绘制。 |
| [Vaei/PushPawn](https://github.com/Vaei/PushPawn) | ⭐83 | **PushPawn** — 网络预测的有机软碰撞系统，在角色靠近其他 Pawn 时提供良好的游戏手感且不会造成同步问题。 |
| [marcohenning/ue5-server-side-rewind](https://github.com/marcohenning/ue5-server-side-rewind) | ⭐31 | **ue5-server-side-rewind** — UE5 中使用服务端回溯（Server-Side Rewind）实现延迟补偿的方案。 |

### 在线服务

| 插件 | Stars | 简介 |
|------|-------|------|
| [betidestudio/EOSIntegrationKit](https://github.com/betidestudio/EOSIntegrationKit) | ⭐406 | **EIK (Epic Online Services Integration Kit)** — 实现 Epic 在线服务（EOS）与 UE 的无缝集成，提供 EOS SDK 的完整访问。 |

### REST & 数据通信

| 插件 | Stars | 简介 |
|------|-------|------|
| [ufna/VaRest](https://github.com/ufna/VaRest) | ⭐— | **VaRest** — UE 的 REST API 插件，支持 RESTful 后端和 JSON 通信。 |
| [rdelian/DeJson](https://github.com/rdelian/DeJson) | ⭐19 | **DeJson** — 在蓝图中方便地处理 JSON 数据的插件。 |

---

## 🖥️ UI 系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [Adriwin06/Ultimate-CommonUI-Menu-System](https://github.com/Adriwin06/Ultimate-CommonUI-Menu-System) | ⭐311 | **Ultimate CommonUI Menu System** — 使用 CommonUI 构建的终极模块化菜单系统，提供完整的选项菜单（画质、音频、输入等）。 |
| [truong-bui/AsyncLoadingScreen](https://github.com/truong-bui/AsyncLoadingScreen) | ⭐— | **AsyncLoadingScreen** — 免费开源的异步加载画面插件，可在项目设置中轻松配置加载界面。 |
| [Luna-Blueshift/BlueshiftGameSettings](https://github.com/Luna-Blueshift/BlueshiftGameSettings) | ⭐37 | **BlueshiftGameSettings** — 扩展用户设置功能，支持蓝图中的游戏用户设置和 UI 绑定框架。 |
| [DoubleDeez/MDViewModel](https://github.com/DoubleDeez/MDViewModel) | ⭐55 | **MDViewModel** — UE5 的 MVVM 插件，支持在 UMG Widget、Actor 和 Object 蓝图中自动数据绑定。 |
| [hollsteinm/UE4-Map-And-Mini-Map](https://github.com/hollsteinm/UE4-Map-And-Mini-Map) | ⭐23 | **UE4-Map-And-Mini-Map** — 支持基于体积的小地图渲染和可缩放平移的地图实现，无需烘焙资产。 |
| [oivio/LyraUI](https://github.com/oivio/LyraUI) | ⭐14 | **LyraUI** — 将 Lyra 的 UI 主菜单抽取为独立的可复用插件。 |
| [Pavreally/WindowManager](https://github.com/Pavreally/WindowManager) | ⭐12 | **WindowManager** — UE5 函数库，用于快速 UI 原型制作和简化界面管理。 |
| [getnamo/BLUI-Unreal](https://github.com/getnamo/BLUI-Unreal) | ⭐410 | **BLUI-Unreal** — 基于 CEF（Chromium Embedded Framework）的 HTML UI 插件，在 UE 中嵌入网页界面。 |
| [engelmanna/UMG3DTransform](https://github.com/engelmanna/UMG3DTransform) | ⭐56 | **UMG3DTransform** — 使用蓝图实现 UMG 图片控件 3D 旋转效果的示例。 |
| [rdelian/ElementUI-UMG-Kit](https://github.com/rdelian/ElementUI-UMG-Kit) | ⭐22 | **ElementUI-UMG-Kit** — 模块化 UMG 元素集合，扩展 Common UI 样式体系。 |

---

## 🔧 编辑器工具

### 通用编辑器扩展

| 插件 | Stars | 简介 |
|------|-------|------|
| [aquanox/SubsystemBrowserPlugin](https://github.com/aquanox/SubsystemBrowserPlugin) | ⭐431 | **SubsystemBrowserPlugin** — 在编辑器中添加子系统浏览器面板，浏览运行中的子系统并编辑属性。 |
| [ElgSoft/ElgEditorScripting](https://github.com/ElgSoft/ElgEditorScripting) | ⭐235 | **ElgEditorScripting** — UE5 编辑器脚本扩展插件，极大扩展了编辑器工具控件（Editor Utility Widget）的功能。 |
| [jorgenpt/Hermes](https://github.com/jorgenpt/Hermes) | ⭐205 | **Hermes** — 支持直接通过深链接（Deep Link）跳转到 UE 编辑器中指定内容的插件。 |
| [tsubasamusu/TsubasamusuUnrealAssist](https://github.com/tsubasamusu/TsubasamusuUnrealAssist) | ⭐26 | **TsubasamusuUnrealAssist** — 编辑器扩展插件，添加了各种实用的编辑器功能。 |
| [arnaud-jamin/Cog](https://github.com/arnaud-jamin/Cog) | ⭐551 | **Cog** — 基于 Dear ImGui 构建的 UE 调试工具集，提供丰富的运行时调试能力。 |
| [hzFishy/EditorLevelSelector](https://github.com/hzFishy/EditorLevelSelector) | ⭐3 | **EditorLevelSelector** — 简单的编辑器关卡选择器插件。 |
| [gerlogu/CustomInGameConsole](https://github.com/gerlogu/CustomInGameConsole) | ⭐39 | **CustomInGameConsole** — 允许在 Release 版本中创建和使用自定义控制台命令。 |
| [MikeShatterwell/InputFlowDebugger](https://github.com/MikeShatterwell/InputFlowDebugger) | ⭐32 | **InputFlowDebugger** — UE UI 与输入调试工具套件，方便排查输入流程问题。 |
| [HoussineMehnik/UE4-SplineSnappingToolPlugin](https://github.com/HoussineMehnik/UE4-SplineSnappingToolPlugin) | ⭐39 | **UE4-SplineSnappingToolPlugin** — 编辑器模式工具，可将关卡中的 Actor 吸附到指定的样条线组件上。 |
| [Lim-Young/ActorLocker](https://github.com/Lim-Young/ActorLocker) | ⭐0 | **ActorLocker** — 在编辑器视口中锁定 Actor 的 UE 插件，防止误操作。 |

### 属性与元数据编辑

| 插件 | Stars | 简介 |
|------|-------|------|
| [DoubleDeez/MDMetaDataEditor](https://github.com/DoubleDeez/MDMetaDataEditor) | ⭐179 | **MDMetaDataEditor** — 在 UE 5.1+ 中编辑蓝图属性、函数和参数的元数据。 |
| [PsinaDev/ue-instanced-object-details](https://github.com/PsinaDev/ue-instanced-object-details) | ⭐4 | **ue-instanced-object-details** — 修复 Instanced (EditInlineNew) UObject 的属性显示问题。 |
| [Lokillouu/PropertyEditorSetter_UE](https://github.com/Lokillouu/PropertyEditorSetter_UE) | ⭐7 | **PropertyEditorSetter_UE** — 拦截属性编辑事件，确保具有 Setter 说明符的 UPROPERTY 正确调用 Setter 函数。 |
| [pramberg/NeatFunctions](https://github.com/pramberg/NeatFunctions) | ⭐11 | **NeatFunctions** — 为 UFUNCTION 添加新的元数据标签，改善蓝图中的使用体验。 |

### 资源管理与烘焙

| 插件 | Stars | 简介 |
|------|-------|------|
| [magnv/EasyCookEditor](https://github.com/magnv/EasyCookEditor) | ⭐11 | **EasyCookEditor** — 简化 UE4 资产烘焙的编辑器插件，主要用于 Modding。 |
| [vicvasper/SmartFoldersPlugin_UE5.6](https://github.com/vicvasper/SmartFoldersPlugin_UE5.6) | ⭐4 | **SmartFoldersPlugin** — 简化 UE 资产组织的工具，消除内容浏览器的杂乱。 |

---

## 🌍 PCG 与程序化生成

| 插件 | Stars | 简介 |
|------|-------|------|
| [PCGEx/PCGExtendedToolkit](https://github.com/PCGEx/PCGExtendedToolkit) | ⭐591 | **PCGExtendedToolkit** — UE PCG 系统的缺失拼图，提供图论、高级寻路、空间操作、过滤和资产管理等功能。 |
| [Esri/cityengine_for_unreal](https://github.com/Esri/cityengine_for_unreal) | ⭐258 | **CityEngine for Unreal** — 将 ArcGIS CityEngine 的强大程序化建模能力引入 UE。 |
| [AdrianPanGithub/HoudiniEngineForUnreal](https://github.com/AdrianPanGithub/HoudiniEngineForUnreal) | ⭐122 | **HoudiniEngineForUnreal** — 从零重建的 Houdini Engine，I/O 速度提升 2-15 倍，专为程序化景观和城市工具集优化。 |
| [Jay2645/Unreal-Polygonal-Map-Gen](https://github.com/Jay2645/Unreal-Polygonal-Map-Gen) | ⭐381 | **Unreal-Polygonal-Map-Gen** — 基于多边形地图生成算法的 UE4 岛屿生成实现。 |
| [cem-akkaya/AutoMapDemo](https://github.com/cem-akkaya/AutoMapDemo) | ⭐9 | **AutoMapDemo** — 程序化地图生成的技术概念验证项目。 |

---

## ⚡ 物理与模拟

| 插件 | Stars | 简介 |
|------|-------|------|
| [fgrenoville/Async-Physics-Suspension](https://github.com/fgrenoville/Async-Physics-Suspension) | ⭐18 | **Async-Physics-Suspension** — 展示 UE5 中通过自定义 FSimCallback 实现异步 Chaos 物理的示例项目，含四弹簧悬挂车辆。 |
| [Dragomirson/PhysXInstancedSubsystem](https://github.com/Dragomirson/PhysXInstancedSubsystem) | ⭐10 | **PhysXInstancedSubsystem** — 高性能 PhysX 实例化插件，专为大规模物理体场景设计，支持数千个实例的高效模拟。 |
| [cem-akkaya/ThermoForgeDemo](https://github.com/cem-akkaya/ThermoForgeDemo) | ⭐7 | **ThermoForgeDemo** — 模拟和查询真实热力、气候和热条件的 UE 插件示例项目。 |

---

## 🎨 渲染与视觉效果

### 粒子与特效

| 插件 | Stars | 简介 |
|------|-------|------|
| [eanticev/niagara-destruction-driver](https://github.com/eanticev/niagara-destruction-driver) | ⭐200 | **niagara-destruction-driver** — 将 CHAOS 可破坏物转换为高性能 GPU 模拟的可破坏静态网格体，由 Niagara 粒子驱动。 |
| [DevDingDangDong/MaaassParticle](https://github.com/DevDingDangDong/MaaassParticle) | ⭐33 | **MaaassParticle** — 通过 Niagara 渲染大规模人群，并可通过状态管理控制群体行为。 |
| [ufna/VaFogOfWar](https://github.com/ufna/VaFogOfWar) | ⭐220 | **VaFogOfWar** — 清晰简洁的 UE4 战争迷雾解决方案。 |
| [LingFengSBH/InteractiveWorld](https://github.com/LingFengSBH/InteractiveWorld) | ⭐172 | **InteractiveWorld** — UE 商城插件 "Interactive World" 的源码，用于创建交互式环境效果。 |

### 体积云与光照

| 插件 | Stars | 简介 |
|------|-------|------|
| [mxcop/vapor](https://github.com/mxcop/vapor) | ⭐13 | **Vapor** — 基于 Nubis 的 UE5 物理体积云渲染插件。 |
| [Thyke/RevealObject](https://github.com/Thyke/RevealObject) | ⭐5 | **RevealObject** — 利用材质参数集（MPC）的手电筒/揭示系统，高效驱动全局着色器效果。 |

### 材质与贴图

| 插件 | Stars | 简介 |
|------|-------|------|
| [vicvasper/Paint-System-5.4](https://github.com/vicvasper/Paint-System-5.4) | ⭐5 | **Paint-System** — UE 5.4 的 C++ 涂绘系统，支持在静态和骨骼网格体上动态涂绘材质，含 RGB 和 Alpha 通道控制。 |

### LOD与Impostor

| 插件 | Stars | 简介 |
|------|-------|------|
| [Erlandys/ImpostorBaker](https://github.com/Erlandys/ImpostorBaker) | ⭐35 | **ImpostorBaker** — 为静态网格体生成 Impostor（替身贴片）的 UE5 插件，用于远距离 LOD 优化。 |
| [jiayaozhang/NaniteTree](https://github.com/jiayaozhang/NaniteTree) | ⭐24 | **NaniteTree** — 将植被模型转换为 UE5.x Nanite 树的工具。 |

---

## 🚀 性能优化

### PSO 与着色器优化

| 插件 | Stars | 简介 |
|------|-------|------|
| [Flassari/PSOCacheBuster](https://github.com/Flassari/PSOCacheBuster) | ⭐116 | **PSOCacheBuster** — 为非发行版和非编辑器构建清除 PSO 驱动缓存，便于测试和分析首次运行体验。 |
| [gregorik/PSO-Autopilot](https://github.com/gregorik/PSO-Autopilot) | ⭐8 | **PSO-Autopilot** — 内存安全的异步着色器编译和 PSO 预热系统。 |

### 帧率与负载管理

| 插件 | Stars | 简介 |
|------|-------|------|
| [eanticev/ue-gameplay-work-balancer](https://github.com/eanticev/ue-gameplay-work-balancer) | ⭐121 | **ue-gameplay-work-balancer** — 帮助将工作负载分片（Time Slice）到多帧执行，保持稳定帧率。 |
| [HaukeThiessen/EnergySavingPlugin](https://github.com/HaukeThiessen/EnergySavingPlugin) | ⭐37 | **EnergySavingPlugin** — 在无输入或窗口失焦时降低最大帧率和画面分辨率以节省能耗，参考了《堡垒之夜》的实践。 |

### Tick 与定时器优化

| 插件 | Stars | 简介 |
|------|-------|------|
| [Thyke/EnhancedTick](https://github.com/Thyke/EnhancedTick) | ⭐32 | **EnhancedTick** — 优化的 Tick 管理方案，支持缓存友好的批量 Tick 操作，大幅提升多 Actor 场景性能。 |
| [Thyke/EnhancedTimerManager](https://github.com/Thyke/EnhancedTimerManager) | ⭐10 | **EnhancedTimerManager** — 高性能的定时器管理方案，支持时间膨胀感知、游戏暂停处理等扩展功能。 |

### 项目精简与分析

| 插件 | Stars | 简介 |
|------|-------|------|
| [daftsoftware/StarterProject](https://github.com/daftsoftware/StarterProject) | ⭐248 | **StarterProject** — 轻量级 UE 起始项目，去除臃肿内容，减少打包体积并提升编辑器和游戏性能。 |
| [vicvasper/Optilogger_UE5.x](https://github.com/vicvasper/Optilogger_UE5.x) | ⭐6 | **Optilogger** — 深度分析关卡资源（网格体、贴图、材质、动画、音频、光照、后处理）的优化分析插件。 |
| [ArcstoneGames/DependencyAnalyser](https://github.com/ArcstoneGames/DependencyAnalyser) | ⭐3 | **DependencyAnalyser** — 测量和分析资产依赖大小瓶颈的 UE5 插件。 |
| [Imloopdev/Perfectly-Optimized](https://github.com/Imloopdev/Perfectly-Optimized) | ⭐— | **Perfectly-Optimized** — 专为低端硬件优化的 UE5 精简启动模板。 |
| [nustxujun/MemViewer](https://github.com/nustxujun/MemViewer) | ⭐3 | **MemViewer** — UE 内存追踪与可视化工具，用于分析内存使用情况。 |

---

## 💻 编程语言扩展

| 插件 | Stars | 简介 |
|------|-------|------|
| [UnrealSharp/UnrealSharp](https://github.com/UnrealSharp/UnrealSharp) | ⭐— | **UnrealSharp** — 支持使用 C#（.NET 9）开发 UE5 游戏的插件，提供热重载功能。 |
| [jmgomez/NimForUE](https://github.com/jmgomez/NimForUE) | ⭐537 | **NimForUE** — UE5 的 Nim 语言插件，提供原生性能和热重载，介于 C++ 和蓝图之间的完整互操作。 |
| [Sebight/seraph](https://github.com/Sebight/seraph) | ⭐11 | **Seraph** — AngelScript 的 C++ 封装库，简化类型注册、函数绑定和脚本与原生代码的互操作。 |
| [ySion/DaxSystem](https://github.com/ySion/DaxSystem) | ⭐5 | **DaxSystem** — UE5 高性能复合数据系统，完整支持 AngelScript。 |
| [Lim-Young/FlowGraph](https://github.com/Lim-Young/FlowGraph) | ⭐3 | **FlowGraph** — 设计无关的节点式系统，用于在 UE 中以可视化方式编排游戏流程。 |

---

## 🎲 ECS 框架

| 插件 | Stars | 简介 |
|------|-------|------|
| [unrays/Exotic](https://github.com/unrays/Exotic) | ⭐7 | **Exotic** — 实验性 ECS 引擎，专为元编程和新一代组件模式设计。 |

---

## 🗺️ 地形与环境

| 插件 | Stars | 简介 |
|------|-------|------|
| [gregorik/TerraDyne](https://github.com/gregorik/TerraDyne) | ⭐35 | **TerraDyne** — 实验性高性能原生 C++ 地形插件，适用于 UE 5.7。 |
| [Casmo/UnrealZoneMarker](https://github.com/Casmo/UnrealZoneMarker) | ⭐4 | **UnrealZoneMarker** — 支持绘制区域并使用样条线和动态网格组件填充区域的插件。 |
| [BakonGuy/UPolyZones](https://github.com/BakonGuy/UPolyZones) | ⭐12 | **UPolyZones** — 多边形区域绘制插件，可测试点是否位于多边形内部。 |

---

## 🔫 战斗与射击

| 插件 | Stars | 简介 |
|------|-------|------|
| [YyepPo/Data_Driven_Projectile](https://github.com/YyepPo/Data_Driven_Projectile) | ⭐25 | **Data_Driven_Projectile** — 轻量级高性能弹道系统，使用数据驱动方式和中央子弹管理器，支持大量子弹且 CPU 开销极低。 |
| [prathameshkhanzode/Advanced-Spray-System-UE5-Cpp](https://github.com/prathameshkhanzode/Advanced-Spray-System-UE5-Cpp) | ⭐8 | **Advanced-Spray-System** — UE5 喷涂系统组件，支持实时表面检测、法线对齐和多人游戏同步。 |
| [Voidware-Prohibited/Ricochet](https://github.com/Voidware-Prohibited/Ricochet) | ⭐4 | **Ricochet** — 基于 GAS 的可复制弹道与投射物系统，适用于大型开放世界游戏。 |
| [michael-royalty/ProjectilesOverview](https://github.com/michael-royalty/ProjectilesOverview) | ⭐13 | **ProjectilesOverview** — UE 投射物追踪方法概览，展示多种弹道跟踪实现方式。 |
| [gregorhcs/GASCancelAbilitiesFromEffect](https://github.com/gregorhcs/GASCancelAbilitiesFromEffect) | ⭐17 | **GASCancelAbilitiesFromEffect** — GAS GameplayEffect 组件，可从效果中取消指定的 Ability。 |

---

## 🎵 音频

| 插件 | Stars | 简介 |
|------|-------|------|
| [Lokillouu/MetaSounds-Notify](https://github.com/Lokillouu/MetaSounds-Notify) | ⭐12 | **MetaSounds-Notify** — 让 MetaSound 系统与外部世界通信！可从 MetaSound 内部向对象、Actor 和蓝图发送通知。 |
| [LeoO5/O5SpectrumWwisePlugin](https://github.com/LeoO5/O5SpectrumWwisePlugin) | ⭐4 | **O5SpectrumWwisePlugin** — 轻量级 Wwise 插件，嵌入实时频谱分析器，并通过公共 C++ API 将 FFT/幅度数据流式传输到游戏运行时。 |
| [ak-brodrigue/waapi-python-tools](https://github.com/ak-brodrigue/waapi-python-tools) | ⭐50 | **waapi-python-tools** — 基于 WAAPI 和 Python 的 Wwise 工具集。 |
| [GameaudioGuru/simpleWind](https://github.com/GameaudioGuru/simpleWind) | ⭐9 | **simpleWind** — 基于白噪声的程序化风声插件，适用于 Wwise。 |
| [adamsmithkipnis/WwiseDeepRenamer](https://github.com/adamsmithkipnis/WwiseDeepRenamer) | ⭐4 | **WwiseDeepRenamer** — Wwise 深度重命名工具，批量重命名 Wwise 对象。 |
| [audiojdub/MSEQ](https://github.com/audiojdub/MSEQ) | ⭐3 | **MSEQ** — Wwise 中/侧（Mid/Side）均衡器插件。 |

---

## 🏗️ 关卡设计

| 插件 | Stars | 简介 |
|------|-------|------|
| [HorizonGamesRoland/ActorIO](https://github.com/HorizonGamesRoland/ActorIO) | ⭐290 | **ActorIO** — 受 Source 引擎启发的关卡脚本工具，为 Actor 提供输入/输出系统，使关卡逻辑可视化编排。 |
| [unknownworlds/prefabricator-ue5](https://github.com/unknownworlds/prefabricator-ue5) | ⭐16 | **Prefabricator-UE5** — Prefab（预制体）系统的 UE5 维护版本，支持关卡中的模块化组件复用。 |

---

## 📦 数据管理与工具库

| 插件 | Stars | 简介 |
|------|-------|------|
| [zompi2/UE4EnhancedCodeFlow](https://github.com/zompi2/UE4EnhancedCodeFlow) | ⭐133 | **UE4EnhancedCodeFlow** — 大幅提升 C++ 游戏流程实现质量的代码插件，提供延迟执行、定时器等便捷函数。 |
| [pyoneerC/Array-Utils](https://github.com/pyoneerC/Array-Utils) | ⭐20 | **Array-Utils** — 面向 UE 核心数据结构的高性能 STL 风格工具集，用 C++ 编写。 |
| [Sixze/FabulousUtility](https://github.com/Sixze/FabulousUtility) | ⭐96 | **FabulousUtility** — 各类实用函数、节点和工具的集合，适用于任何类型的 UE 项目。 |
| [jign/SkyLifeguard](https://github.com/jign/SkyLifeguard) | ⭐8 | **SkyLifeguard** — 受契约式设计（DbC）启发的 UE5 断言式编程框架。 |
| [Islamantin/BlueprintRetarget](https://github.com/Islamantin/BlueprintRetarget) | ⭐5 | **BlueprintRetarget** — 当父类丢失时重新定向无效蓝图的小工具。 |
| [cem-akkaya/GameColors](https://github.com/cem-akkaya/GameColors) | ⭐6 | **GameColors** — 高效组织和管理游戏玩法中颜色的插件。 |

---

## 💾 存档系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [GunfireGames/GunfireSaveSystem](https://github.com/GunfireGames/GunfireSaveSystem) | ⭐13 | **GunfireSaveSystem** — 功能更强大的 UE5 存档系统，适合复杂项目的存档需求。 |
| [thelightxen/IgorSaves](https://github.com/thelightxen/IgorSaves) | ⭐5 | **IgorSaves** — UE 存档系统，灵感来源于《你好邻居》的存档机制。 |
| [sinbad/SPUD](https://github.com/sinbad/SPUD) | ⭐— | **SPUD** — Steve's Persistent Unreal Data，UE 持久化数据存储库。 |

---

## 🔄 对象池

| 插件 | Stars | 简介 |
|------|-------|------|
| [Lim-Young/PoolManager](https://github.com/Lim-Young/PoolManager) | ⭐5 | **PoolManager** — 开源对象池管理插件，帮助在 UE 5.5 中复用对象以提升性能。 |

---

## 🌏 本地化

| 插件 | Stars | 简介 |
|------|-------|------|
| [zompi2/UE4EasyLocalizationTool](https://github.com/zompi2/UE4EasyLocalizationTool) | ⭐120 | **UE4EasyLocalizationTool** — 通过导入 CSV 文件来简化 UE 本地化流程的插件。 |
| [BraceYourselfGames/UE-BYGLocalization](https://github.com/BraceYourselfGames/UE-BYGLocalization) | ⭐88 | **UE-BYGLocalization** — 简洁的 CSV 本地化系统，适用于 UE 项目的多语言支持。 |

---

## 🎬 媒体

| 插件 | Stars | 简介 |
|------|-------|------|
| [surgeshi/FFMPEGMediaUE5](https://github.com/surgeshi/FFMPEGMediaUE5) | ⭐26 | **FFMPEGMediaUE5** — 基于 FFMPEG 的 UE5 媒体插件，支持更多平台（Linux/Android/Mac/Windows）和更多视频格式（含 Alpha 视频）。 |
| [jwatsn/ThumbnailPlugin](https://github.com/jwatsn/ThumbnailPlugin) | ⭐5 | **ThumbnailPlugin** — 在运行时为模型生成缩略图的简单插件。 |
| [earthstorm2015/ueblueprint](https://github.com/earthstorm2015/ueblueprint) | ⭐6 | **ueblueprint** — UE 蓝图可视化 Web 库，可在网页中展示蓝图节点图。 |
| [Lim-Young/UE_CaptureSubsystem](https://github.com/Lim-Young/UE_CaptureSubsystem) | ⭐2 | **UE_CaptureSubsystem** — UE 运行时视频和截图捕获系统。 |

---

## 📐 几何与 Mesh

| 插件 | Stars | 简介 |
|------|-------|------|
| [alicepm800/Exploding-Geometry-Script-Plugin](https://github.com/alicepm800/Exploding-Geometry-Script-Plugin) | ⭐6 | **Exploding-Geometry-Script-Plugin** — 通过修改距离变量在编辑器中创建顶点爆炸效果。 |
| [LingFengSBH/SplineSweepMesh](https://github.com/LingFengSBH/SplineSweepMesh) | ⭐8 | **SplineSweepMesh** — 样条线扫描网格体生成插件。 |

---

## 🔨 构建与管线工具

| 插件 | Stars | 简介 |
|------|-------|------|
| [RedpointGames/uet](https://github.com/RedpointGames/uet) | ⭐133 | **UET (Unreal Engine Tool)** — 让构建和测试 UE 项目及插件变得简单，支持 BuildGraph 分发、远程自动化测试等。 |
| [Naotsun19B/PluginBuilder](https://github.com/Naotsun19B/PluginBuilder) | ⭐35 | **PluginBuilder** — 支持使用多引擎版本构建插件并压缩为 ZIP 格式的编辑器插件，方便商城提交。 |
| [jobrogi/-UE-Plugin-Multi-Version-Builder](https://github.com/jobrogi/-UE-Plugin-Multi-Version-Builder) | ⭐2 | **UE-Plugin-Multi-Version-Builder** — 自定义 PowerShell 脚本，用于构建多个版本的 UE 插件，适合 Fab 商城分发。 |
| [pafuhana1213/UnrealEngine-UpdateTracker](https://github.com/pafuhana1213/UnrealEngine-UpdateTracker) | ⭐44 | **UnrealEngine-UpdateTracker** — 自动监控 UE 私有 GitHub 仓库更新，使用 AI 总结重要变更的服务。 |
| [mickexd/UnrealEnginePluginMigrationTool](https://github.com/mickexd/UnrealEnginePluginMigrationTool) | ⭐63 | **UnrealEnginePluginMigrationTool** — Python GUI 工具，使用 UAT 在不同 UE 版本间迁移插件。 |

---

## 🤖 AI 辅助开发

| 插件 | Stars | 简介 |
|------|-------|------|
| [ChiR24/Unreal_mcp](https://github.com/ChiR24/Unreal_mcp) | ⭐359 | **Unreal_mcp** — 综合性 MCP 服务器，通过原生 C++ 自动化桥接插件让 AI 助手控制 UE 编辑器。 |
| [Natfii/UnrealClaude](https://github.com/Natfii/UnrealClaude) | ⭐253 | **UnrealClaude** — Claude Code CLI 与 UE 5.7 的集成，在编辑器中直接获取内置 UE5.7 文档上下文的 AI 编码辅助。 |
| [stefan1000/p4mcp-server](https://github.com/stefan1000/p4mcp-server) | ⭐5 | **p4mcp-server** — 社区支持的 Perforce P4 版本控制 MCP 服务器。 |

---

## 🔗 DCC 桥接工具

> 注：Blender 相关的 DCC 桥接工具已整合到 [🎨 Blender 插件](#-blender-插件-blender-addons) 章节中。

---

## 📚 文档与学习资源

| 插件 | Stars | 简介 |
|------|-------|------|
| [tranek/GASDocumentation](https://github.com/tranek/GASDocumentation) | ⭐— | **GASDocumentation** — 对 UE5 GameplayAbilitySystem 插件的深入理解，附带简单的多人游戏示例项目。 |
| [fjz13/UnrealSpecifiers](https://github.com/fjz13/UnrealSpecifiers) | ⭐985 | **UnrealSpecifiers** — UE5 标识符详解，包含 100+ 个标识符以及 300+ 个 Meta 的解释和示例。 |
| [khaled71612000/UnrealThreads](https://github.com/khaled71612000/UnrealThreads) | ⭐12 | **UnrealThreads** — 展示 UE 中各种多线程技术的实现项目。 |
| [lucoiso/UEProject_Elementus](https://github.com/lucoiso/UEProject_Elementus) | ⭐197 | **UEProject_Elementus** — 使用 UE5 新特性（GAS等）的项目模板。 |
| [mikeroyal/Game-Console-Dev-Guide](https://github.com/mikeroyal/Game-Console-Dev-Guide) | ⭐334 | **Game-Console-Dev-Guide** — 游戏主机开发指南，涵盖 Xbox、PS5、Switch、Steam Deck 的 UE5/Unity/Godot 开发。 |

---

## 🎯 游戏框架与模板

| 插件 | Stars | 简介 |
|------|-------|------|
| [hfjooste/UltimateStarterKit](https://github.com/hfjooste/UltimateStarterKit) | ⭐353 | **UltimateStarterKit** — 加速 UE 游戏开发的终极起始工具包插件。 |
| [ydrive/EasySynth](https://github.com/ydrive/EasySynth) | ⭐227 | **EasySynth** — 轻松创建合成图像数据集的 UE 插件，适用于计算机视觉和机器学习。 |

---

## 🎮 输入系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [rafaelvaloto/Gamepad-CoOp](https://github.com/rafaelvaloto/Gamepad-CoOp) | ⭐8 | **Gamepad-CoOp** — 手柄管理插件，简化本地多人游戏体验的创建，提供引擎输入系统的抽象层。 |

---

## 📷 相机系统

| 插件 | Stars | 简介 |
|------|-------|------|
| [gerlogu/FixedCameraSystem](https://github.com/gerlogu/FixedCameraSystem) | ⭐31 | **FixedCameraSystem** — 用于在 UE 中创建电影化场景的 C++ 固定相机工具集。 |
| [CasperTheCat/UnrealExtendedCamera](https://github.com/CasperTheCat/UnrealExtendedCamera) | ⭐5 | **UnrealExtendedCamera** — UE 扩展相机系统，提供更多相机控制功能。 |

---

## 🧩 C++ 协程 (Coroutines)

| 插件 | Stars | 简介 |
|------|-------|------|
| [landelare/ue5coro](https://github.com/landelare/ue5coro) | ⭐1017 | **ue5coro** — 深度集成的 C++20 协程插件，为 Unreal Engine 5 提供原生协程支持，简化异步编程。 |

---

## 🤖 AI 与大模型工具 (AI & LLM Tools)

| 插件 | Stars | 简介 |
|------|-------|------|
| [langflow-ai/langflow](https://github.com/langflow-ai/langflow) | ⭐— | **Langflow** — 强大的 AI 代理和工作流构建与部署工具，支持可视化编排。 |
| [Comfy-Org/ComfyUI](https://github.com/Comfy-Org/ComfyUI) | ⭐— | **ComfyUI** — 最强大的模块化扩散模型 GUI，提供图形/节点界面进行 AI 图像生成。 |
| [sakalond/StableGen](https://github.com/sakalond/StableGen) | ⭐684 | **StableGen** — 在 Blender 中使用生成式 AI 变革 3D 贴图工作流。 |
| [OneRedOak/claude-code-workflows](https://github.com/OneRedOak/claude-code-workflows) | ⭐— | **claude-code-workflows** — Claude Code 最佳工作流集合，从发布日起持续更新。 |
| [KsanaDock/Microverse](https://github.com/KsanaDock/Microverse) | ⭐— | **Microverse** — 基于 Godot 4 构建的上帝模拟沙盒游戏，多智能体 AI 社会模拟系统。 |
| [zai-org/GLM-TTS](https://github.com/zai-org/GLM-TTS) | ⭐944 | **GLM-TTS** — 可控且情感表达丰富的零样本语音合成，支持多奖励强化学习。 |
| [666ghj/MiroFish](https://github.com/666ghj/MiroFish) | ⭐— | **MiroFish** — 简单通用的群体智能引擎，可用于多场景预测。 |
| [MVPandey/DTS](https://github.com/MVPandey/DTS) | ⭐35 | **DTS** — 受 MCTS 启发的并行束搜索，用于对话优化。 |
| [EvoMap/evolver](https://github.com/EvoMap/evolver) | ⭐1446 | **evolver** — 基于 GEP 的 AI 代理自进化引擎。 |
| [shuyu-labs/WebCode](https://github.com/shuyu-labs/WebCode) | ⭐375 | **WebCode** — 基于浏览器的 AI 编程平台，支持 Claude Code 等 CLI 助手。 |
| [iOfficeAI/AionUi](https://github.com/iOfficeAI/AionUi) | ⭐— | **AionUi** — 免费、本地、开源的 24/7 AI CLI 工具协作应用。 |
| [KeygraphHQ/shannon](https://github.com/KeygraphHQ/shannon) | ⭐— | **shannon** — 全自主 AI 渗透测试工具，适用于 Web 应用和 API 安全测试。 |
| [moeru-ai/airi](https://github.com/moeru-ai/airi) | ⭐— | **airi** — 自托管 AI 伴侣，支持实时语音聊天。 |
| [PDFMathTranslate/PDFMathTranslate](https://github.com/PDFMathTranslate/PDFMathTranslate) | ⭐— | **PDFMathTranslate** — PDF 科学论文翻译工具，保留原始排版格式。 |
| [continuedev/continue](https://github.com/continuedev/continue) | ⭐— | **continue** — 源码控制的 AI 检查工具，可在 CI 中强制执行。 |

---

## 🎨 Blender 插件 (Blender Addons)

| 插件 | Stars | 简介 |
|------|-------|------|
| [xavier150/Blender-For-UnrealEngine-Addons](https://github.com/xavier150/Blender-For-UnrealEngine-Addons) | ⭐2474 | **Blender-For-UnrealEngine-Addons** — 从 Blender 导出资产到 UE 的 Blender 插件，支持完整的导出管线。 |
| [Jim-Kroovy/Mr-Mannequins-Tools](https://github.com/Jim-Kroovy/Mr-Mannequins-Tools) | ⭐541 | **Mr-Mannequins-Tools** — Blender 工具集，支持 UE 角色的骨骼绑定、Blender 导入和 Unreal 导出。 |
| [skarndev/umodel_tools](https://github.com/skarndev/umodel_tools) | ⭐135 | **umodel_tools** — Blender 插件，支持导入 UE 游戏的静态网格体和关卡地图。 |
| [nitecon/AssetsBridge](https://github.com/nitecon/AssetsBridge) | ⭐6 | **AssetsBridge** — 提供 UE 和 Blender 之间的资产桥接能力。 |
| [mayloglog/FakeBones](https://github.com/mayloglog/FakeBones) | ⭐25 | **FakeBones** — 增强从 Maya、Unreal 等软件导入骨架可视化的 Blender 插件。 |
| [mio3io/mio3_uv](https://github.com/mio3io/mio3_uv) | ⭐503 | **mio3_uv** — Blender UV 编辑辅助插件，支持 Blender 4/5。 |
| [ucupumar/ucupaint](https://github.com/ucupumar/ucupaint) | ⭐2091 | **ucupaint** — Blender 纹理图层管理插件，支持 Eevee 和 Cycles 渲染器。 |
| [eXzacT/RePrimitive](https://github.com/eXzacT/RePrimitive) | ⭐100 | **RePrimitive** — Blender 基础体调整插件，无需从头创建即可修改基础体参数。 |
| [GhislainGir/GameTools](https://github.com/GhislainGir/GameTools) | ⭐137 | **GameTools** — Blender 游戏开发插件，包含专业级游戏开发技术工具集。 |

---

## 🌐 网络框架与库 (Networking Libraries)

| 插件 | Stars | 简介 |
|------|-------|------|
| [pond3r/ggpo](https://github.com/pond3r/ggpo) | ⭐3474 | **GGPO** — Good Game Peace Out 回滚网络 SDK，用于实现低延迟的 P2P 对战网络同步。 |

---

## 🎮 Unity 相关 (Unity Related)

| 插件 | Stars | 简介 |
|------|-------|------|
| [No78Vino/gameplay-ability-system-for-unity](https://github.com/No78Vino/gameplay-ability-system-for-unity) | ⭐754 | **gameplay-ability-system-for-unity** — Unity 版 Gameplay Ability System，移植自 UE 的 GAS 框架。 |
| [Siccity/xNode](https://github.com/Siccity/xNode) | ⭐3705 | **xNode** — Unity 节点编辑器框架，在 Unity 内查看和编辑节点图。 |

---

## 🛠️ 通用管线与协作工具 (General Pipeline & Collaboration)

| 插件 | Stars | 简介 |
|------|-------|------|
| [Southpaw-TACTIC/TACTIC](https://github.com/Southpaw-TACTIC/TACTIC) | ⭐496 | **TACTIC** — 开源远程协作平台，适用于企业级工作流管理。 |
| [NickeManarin/ScreenToGif](https://github.com/NickeManarin/ScreenToGif) | ⭐— | **ScreenToGif** — 屏幕录制工具，可录制选定区域并保存为 GIF 或视频格式。 |
| [Nebukam/mkfont](https://github.com/Nebukam/mkfont) | ⭐67 | **mkfont** — 免费的字体创建与导出工具，从现有资产生成字体文件。 |
| [11cafe/jaaz](https://github.com/11cafe/jaaz) | ⭐5955 | **jaaz** — 全球首个开源多模态创意助手。 |

---

## 🐍 Python 工具库 (Python Libraries)

| 插件 | Stars | 简介 |
|------|-------|------|
| [pyapp-kit/magicgui](https://github.com/pyapp-kit/magicgui) | ⭐503 | **magicgui** — 基于类型注解自动生成 GUI 的 Python 库。 |
| [Rockhopper-Technologies/pluginlib](https://github.com/Rockhopper-Technologies/pluginlib) | ⭐77 | **pluginlib** — Python 插件创建与导入框架。 |

---

## 🎯 游戏资源 (Game Assets)

| 插件 | Stars | 简介 |
|------|-------|------|
| [menggekkd/mengge_game_ui_icons](https://github.com/menggekkd/mengge_game_ui_icons) | ⭐29 | **mengge_game_ui_icons** — 萌歌的游戏 UI 图标资源集合。 |

---

## 📚 学习文档与教程 (Learning Docs & Tutorials)

| 插件 | Stars | 简介 |
|------|-------|------|
| [krahets/hello-algo](https://github.com/krahets/hello-algo) | ⭐123015 | **Hello 算法** — 动画图解数据结构与算法教程，面向初学者的开源项目。 |
| [0xFA11/MultiplayerNetworkingResources](https://github.com/0xFA11/MultiplayerNetworkingResources) | ⭐8412 | **MultiplayerNetworkingResources** — 多人游戏网络编程资源精选列表。 |
| [LandChaunax/mass-vamp-like](https://github.com/LandChaunax/mass-vamp-like) | ⭐4 | **mass-vamp-like** — 使用 Mass 框架制作类吸血鬼幸存者游戏的教程指南，支持千人级敌人。 |

---

## ⚙️ 游戏引擎与底层库 (Game Engines & Core Libraries)

| 插件 | Stars | 简介 |
|------|-------|------|
| [o3de/o3de](https://github.com/o3de/o3de) | ⭐— | **Open 3D Engine** — 开源 3D 游戏引擎（Apache 2.0 许可），支持 AAA 级游戏开发。 |
| [jrouwe/JoltPhysics](https://github.com/jrouwe/JoltPhysics) | ⭐— | **JoltPhysics** — 多核友好的刚体物理和碰撞检测库。 |
| [skypjack/entt](https://github.com/skypjack/entt) | ⭐— | **EnTT** — 高性能 C++ ECS 游戏开发库。 |
| [llvm/llvm-project](https://github.com/llvm/llvm-project) | ⭐— | **LLVM** — LLVM 编译器工具链项目。 |

---

## 🔧 通用开发工具 (General Development Tools)

| 插件 | Stars | 简介 |
|------|-------|------|
| [tauri-apps/tauri](https://github.com/tauri-apps/tauri) | ⭐— | **Tauri** — 使用 Web 前端构建更小、更快、更安全的桌面/移动应用程序。 |
| [GraphiteEditor/Graphite](https://github.com/GraphiteEditor/Graphite) | ⭐— | **Graphite** — 开源 2D 内容创建工具，支持基于节点的程序化编辑。 |
| [spotDL/spotify-downloader](https://github.com/spotDL/spotify-downloader) | ⭐— | **spotify-downloader** — 下载 Spotify 播放列表并附带元数据信息。 |
| [RikkaApps/Shizuku](https://github.com/RikkaApps/Shizuku) | ⭐— | **Shizuku** — 在 Android 上使用 adb/root 权限直接调用系统 API。 |
| [googlehosts/hosts](https://github.com/googlehosts/hosts) | ⭐— | **googlehosts** — Google hosts 镜像，用于网络访问优化。 |
| [Tyrrrz/DiscordChatExporter](https://github.com/Tyrrrz/DiscordChatExporter) | ⭐— | **DiscordChatExporter** — 将 Discord 聊天记录导出保存为文件。 |
| [lobehub/lobehub](https://github.com/lobehub/lobehub) | ⭐— | **lobehub** — AI 代理协作平台。 |
| [Tencent/libpag](https://github.com/Tencent/libpag) | ⭐— | **libpag** — PAG 文件的官方渲染库，由腾讯开源。 |
| [SpecialKO/SpecialK](https://github.com/SpecialKO/SpecialK) | ⭐— | **SpecialK** — PC 游戏性能优化瑞士军刀工具。 |

---

> 📌 **注：** 本文整理 GitHub 上的仓库，涵盖 Unreal Plugin、Unreal Basic Plugins、Unreal Doc、AI、Pipeline、Blender、Doc、Net、Assets、Python、Unity、Godot、Wwise 等分类。Stars 数量截至 2026 年 3 月，部分仓库 Stars 数量标记为 "—" 表示该仓库 Star 数未获取到或为大型仓库（超过 1000 Stars）。由于 GitHub 页面渲染限制，本文可能未覆盖全部仓库，但已尽力包含绝大多数收藏项目。
