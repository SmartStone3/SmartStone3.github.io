---
title: "GAS完整指南"
date: 2026-04-17T10:00:00+08:00
draft: false
slug: "GAS Documentation"
tags: ["Unreal Engine", "GAS", "GameplayAbilitySystem", "C++"]
featured: true
---

我对 Unreal Engine 5 的 GameplayAbilitySystem 插件（GAS）的理解，附带一个简单的多人联机示例项目。这不是官方文档，本项目和我本人都与 Epic Games 没有关联。我不保证这些信息的准确性。

这份文档的目标是解释 GAS 中的主要概念和类，并基于我的使用经验补充一些说明。社区用户之间存在很多关于 GAS 的“口口相传经验”，我希望把我知道的内容都分享在这里。

示例项目和本文档当前基于 **Unreal Engine 5.3**（UE5）。本文档为旧版本 Unreal Engine 提供过分支，但这些分支已不再维护，可能存在 bug 或信息过时的问题。请使用与你的引擎版本匹配的分支。

[GASShooter](https://github.com/tranek/GASShooter) 是一个姊妹示例项目，展示了多人 FPS/TPS 中 GAS 的高级技巧。


最好的文档永远是插件源码本身。

<a name="intro"></a>
## 1. GameplayAbilitySystem 插件简介
摘自[官方文档](https://docs.unrealengine.com/en-US/Gameplay/GameplayAbilitySystem/index.html)：

> Gameplay Ability System 是一个高度灵活的框架，用于构建你在 RPG 或 MOBA 类型游戏中常见的能力与属性。你可以为游戏角色创建动作类或被动类能力，创建会逐步增强或削弱各种属性的状态效果，实现用于限制这些动作使用的“冷却”计时器或资源消耗，在每个等级上改变 Ability 及其效果的等级数值，触发粒子或音效，等等。简单来说，这个系统可以帮助你设计、实现并高效联网同步游戏内能力，小到跳跃，大到任何现代 RPG 或 MOBA 游戏中你最喜欢角色的完整技能组。
>

GameplayAbilitySystem 插件由 Epic Games 开发，并随 Unreal Engine 一起提供。它已经在 Paragon、Fortnite 等 AAA 商业游戏中经过实战验证。

该插件为单机和多人游戏开箱即用地提供了以下能力：

* 实现带可选消耗与冷却的、基于等级的角色能力或技能（[GameplayAbilities](#concepts-ga)）
* 操作属于 actors 的数值型 `Attributes`（[Attributes](#concepts-a)）
* 为 actors 应用状态效果（[GameplayEffects](#concepts-ge)）
* 为 actors 应用 `GameplayTags`（[GameplayTags](#concepts-gt)）
* 生成视觉或音效（[GameplayCues](#concepts-gc)）
* 对以上所有内容进行 Replication

在多人游戏中，GAS 还支持以下内容的[客户端](#concepts-p)：

* Ability 激活
* 播放动画蒙太奇
* `Attributes` 变化
* 应用 `GameplayTags`
* 生成 `GameplayCues`
* 通过连接到 `CharacterMovementComponent` 的 `RootMotionSource` 函数进行移动

**GAS 必须在 C++ 中完成设置**，但设计师可以用 Blueprint 创建 `GameplayAbilities` 和 `GameplayEffects`。

GAS 当前存在的问题：

* `GameplayEffect` 的延迟校正问题（无法 Prediction Ability 冷却，因此高延迟玩家在低冷却 Ability 上的射速会低于低延迟玩家）。
* 无法 Prediction `GameplayEffects` 的移除。不过我们可以 Prediction 添加带相反效果的 `GameplayEffects`，从效果上等于移除它们。但这并不总是合适或可行，因此仍然是个问题。
* 缺少样板模板、多人示例和文档。希望这份文档能帮上忙！

**[⬆ 返回顶部](#table-of-contents)**

<a name="sp"></a>
## 2. 示例项目
本文档附带了一个多人第三人称射击示例项目，面向刚接触 GameplayAbilitySystem 插件、但并非 Unreal Engine 新手的读者。默认读者已经了解 UE 中的 C++、Blueprints、UMG、Replication 以及其他中级主题。这个项目展示了如何搭建一个基础的、可用于多人联机的第三人称射击项目：对于玩家/AI 控制的英雄，将 `AbilitySystemComponent`（`ASC`）放在 `PlayerState` 类上；对于 AI 控制的小兵，则将 `ASC` 放在 `Character` 类上。

目标是在保持项目简单的同时展示 GAS 基础知识，并通过带有充分注释的代码演示一些常被请求实现的能力。由于聚焦入门内容，本项目不会展示像[Prediction 投射物](#concepts-p-spawn)这样的高级主题。

演示的概念包括：

* `ASC` 位于 `PlayerState` 与位于 `Character` 的区别
* 已 Replication 的 `Attributes`
* 已 Replication 的动画蒙太奇
* 在 `GameplayAbilities` 内部以及外部应用和移除 `GameplayEffects`
* 通过护甲减伤后再对角色生命值造成伤害
* 眩晕效果
* 死亡与重生
* 在服务器上从 Ability 生成 actors（投射物）
* 通过开镜瞄准和冲刺，对本地玩家速度进行 Prediction 变化
* 持续消耗耐力以冲刺
* 使用法力释放 Abilities
* 被动 Abilities
* 堆叠 `GameplayEffects`
* 在 Blueprint 中创建的 `GameplayAbilities`
* 在 C++ 中创建的 `GameplayAbilities`
* 按 `Actor` 实例化的 `GameplayAbilities`
* 非实例化 `GameplayAbilities`（Jump）
* 静态 `GameplayCues`（FireGun 投射物命中粒子效果）
* Actor `GameplayCues`（Sprint 和 Stun 粒子效果）

英雄类拥有以下 Abilities：

| 能力| 输入绑定| Prediction| C++ / Blueprint| 描述|
| --------------------------| -------------------| ----------| ---------------| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Jump| Space Bar| Yes| C++| 使英雄跳跃。|
| Gun| Left Mouse Button| No| C++| 从英雄的枪发射一个投射物。动画是 Prediction 的，但投射物不是。|
| Aim Down Sights| Right Mouse Button| Yes| Blueprint| 按住按键时，英雄会减速行走，摄像机拉近，以便更精准地射击。|
| Sprint| Left Shift| Yes| Blueprint| 按住按键时，英雄会以更快速度奔跑并消耗耐力。|
| Forward Dash| Q| Yes| Blueprint| 英雄向前冲刺，消耗耐力。|
| Passive Armor Stacks| Passive| No| Blueprint| 每 4 秒英雄获得一层护甲，最多 4 层。受到伤害时会移除一层护甲。|
| Meteor| R| No| Blueprint| 玩家选定一个位置，在敌人头顶落下一颗陨石，造成伤害并眩晕。Targeting 是 Prediction 的，但生成陨石不是。|

`GameplayAbilities` 用 C++ 还是 Blueprint 创建并不重要。这里混合使用两种方式，只是为了演示如何在两种语言中实现。

小兵没有任何预定义的 `GameplayAbilities`。红方小兵有更高的生命回复，而蓝方小兵有更高的初始生命值。

在 `GameplayAbility` 命名上，我使用后缀 `_BP` 表示该 `GameplayAbility` 的逻辑是用 Blueprint 编写的。没有后缀则表示逻辑是用 C++ 编写的。

**Blueprint 资源命名前缀 / Blueprint Asset Naming Prefixes**

| 前缀| 资源类型|
| -----------| -------------------|

**[⬆ 返回顶部](#table-of-contents)**

<a name="setup"></a>
## 3. 使用 GAS 设置项目
使用 GAS 设置项目的基本步骤如下：

1. 在 Editor 中启用 GameplayAbilitySystem 插件
1. 编辑 `YourProjectName.Build.cs`，将 `"GameplayAbilities", "GameplayTags", "GameplayTasks"` 添加到 `PrivateDependencyModuleNames`
1. 刷新/重新生成 Visual Studio 项目文件
1. 从 4.24 到 5.2，若要使用 [`TargetData`](#concepts-targeting-data)，必须调用 `UAbilitySystemGlobals::Get().InitGlobalData()`。示例项目在 `UAssetManager::StartInitialLoading()` 中完成此调用。从 5.3 开始这一步会自动执行。更多信息见 [`InitGlobalData()`](#concepts-asg-initglobaldata)。

这就是启用 GAS 所需要做的全部工作。接下来，把 [`ASC`](#concepts-asc) 和 [`AttributeSet`](#concepts-as) 添加到你的 `Character` 或 `PlayerState`，然后开始创建 [`GameplayAbilities`](#concepts-ga) 和 [`GameplayEffects`](#concepts-ge) 吧！

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts"></a>
## 4. GAS 概念

#### 小节

> 4.1 [关于 Ability System Component](#concepts-asc)
> 4.2 [关于 Gameplay Tags](#concepts-gt)
> 4.3 [关于 Attributes](#concepts-a)
> 4.4 [关于 Attribute Set](#concepts-as)
> 4.5 [关于 Gameplay Effects](#concepts-ge)
> 4.6 [关于 Gameplay Abilities](#concepts-ga)
> 4.7 [关于 Ability Tasks](#concepts-at)
> 4.8 [关于 Gameplay Cues](#concepts-gc)
> 4.9 [关于 Ability System Globals](#concepts-asg)
> 4.10 [关于 Prediction](#concepts-p)

<a name="concepts-asc"></a>
### 4.1 关于 Ability System Component
`AbilitySystemComponent`（`ASC`）是 GAS 的核心。它是一个 `UActorComponent`（[`UAbilitySystemComponent`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/UAbilitySystemComponent/index.html)），负责处理与整个系统的所有交互。任何希望使用 [`GameplayAbilities`](#concepts-ga)、拥有 [`Attributes`](#concepts-a) 或接收 [`GameplayEffects`](#concepts-ge) 的 `Actor`，都必须附加一个 `ASC`。这些对象都存在于 `ASC` 中，并由 `ASC` 管理和 Replication（`Attributes` 例外，它们由各自的 [`AttributeSet`](#concepts-as) 负责 Replication）。开发者通常会为它创建子类，但并非强制要求。

附加了 `ASC` 的 `Actor` 被称为该 `ASC` 的 `OwnerActor`。`ASC` 的物理表现 `Actor` 被称为 `AvatarActor`。在 MOBA 中的简单 AI 小兵场景里，`OwnerActor` 和 `AvatarActor` 可以是同一个 `Actor`。它们也可以是不同的 `Actors`，例如在玩家控制的 MOBA 英雄场景中，`OwnerActor` 是 `PlayerState`，而 `AvatarActor` 是英雄的 `Character` 类。大多数 `Actors` 会把 `ASC` 放在自己身上。如果你的 `Actor` 会重生，并且需要在多次生成之间保留 `Attributes` 或 `GameplayEffects`（例如 MOBA 英雄），那么把 `ASC` 放在 `PlayerState` 上通常是最理想的选择。

**注意：** 如果你的 `ASC` 在 `PlayerState` 上，那么你需要提高 `PlayerState` 的 `NetUpdateFrequency`。`PlayerState` 默认值非常低，这会导致客户端在 `Attributes`、`GameplayTags` 等变化生效前出现延迟或体感卡顿。请务必启用 [`Adaptive Network Update Frequency`](https://docs.unrealengine.com/en-US/Gameplay/Networking/Actors/Properties/index.html#adaptivenetworkupdatefrequency)，Fortnite 就使用了它。

如果 `OwnerActor` 和 `AvatarActor` 是不同的 `Actors`，那么两者都应该实现 `IAbilitySystemInterface`。这个接口只要求重写一个函数：`UAbilitySystemComponent* GetAbilitySystemComponent() const`，用于返回其 `ASC` 指针。系统内部的 `ASCs` 之间会通过查找这个接口函数来互相交互。

`ASC` 使用 `FActiveGameplayEffectsContainer ActiveGameplayEffects` 保存当前激活的 `GameplayEffects`。

`ASC` 使用 `FGameplayAbilitySpecContainer ActivatableAbilities` 保存它被授予的 `Gameplay Abilities`。任何时候只要你计划遍历 `ActivatableAbilities.Items`，都务必在循环上方加上 `ABILITYLIST_SCOPE_LOCK();`，以便在遍历期间锁定列表不被修改（例如避免 Ability 在遍历时被移除）。作用域内每出现一个 `ABILITYLIST_SCOPE_LOCK();`，`AbilityScopeLockCount` 就会加一；离开作用域时再减一。不要在 `ABILITYLIST_SCOPE_LOCK();` 的作用域内尝试移除 Ability（清除 Ability 的相关函数会在内部检查 `AbilityScopeLockCount`，防止在列表锁定时移除 Ability）。

<a name="concepts-asc-rm"></a>
### 4.1.1 关于 Replication Mode
`ASC` 为 `GameplayEffects`、`GameplayTags` 和 `GameplayCues` 提供了三种不同的 Replication 模式：`Full`、`Mixed` 和 `Minimal`。`Attributes` 的 Replication 由它们各自的 `AttributeSet` 负责。

| Replication Mode| 使用场景| 描述|
| ------------------| ---------------------------------------| ------------------------------------------------------------------------------------------------------------------------------|
| `Full`| 单人游戏| 每个 `GameplayEffect` 都会 Replication 给每个客户端。|
| `Mixed`| 多人游戏、玩家控制的 `Actors`|只会 Replication 给拥有者客户端；只有 `GameplayTags` 和 `GameplayCues` 会 Replication 给所有人。|
| `Minimal`| 多人游戏、AI 控制的 `Actors`|不会 Replication 给任何人；只有 `GameplayTags` 和 `GameplayCues` 会 Replication 给所有人。|

**注意：** `Mixed` Replication 模式要求 `OwnerActor` 的 `Owner` 必须是 `Controller`。`PlayerState` 的 `Owner` 默认就是 `Controller`，但 `Character` 的不是。如果你在 `OwnerActor` 不是 `PlayerState` 的情况下使用 `Mixed` Replication 模式，那么需要对 `OwnerActor` 调用 `SetOwner()` 并传入有效的 `Controller`。

从 4.24 开始，`PossessedBy()` 现在会把 `Pawn` 的 owner 设置为新的 `Controller`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-asc-setup"></a>
### 4.1.2 设置与初始化
`ASC` 通常会在 `OwnerActor` 的构造函数中创建，并显式标记为可 Replication。**这一步必须在 C++ 中完成。**

```c++
AGDPlayerState::AGDPlayerState()
{
	// Create ability system component, and set it to be explicitly replicated
	AbilitySystemComponent = CreateDefaultSubobject<UGDAbilitySystemComponent>(TEXT("AbilitySystemComponent"));
	AbilitySystemComponent->SetIsReplicated(true);
	//...
}
```

`ASC` 需要在服务器和客户端两侧都用它的 `OwnerActor` 与 `AvatarActor` 完成初始化。你应当在 `Pawn` 的 `Controller` 已经设置好之后（即 possession 之后）再初始化。单机游戏只需要关心服务器路径。

对于 `ASC` 位于 `Pawn` 上的玩家控制角色，我通常会在服务器端的 `Pawn::PossessedBy()` 中初始化，并在客户端的 `PlayerController::AcknowledgePossession()` 中初始化。

```c++
void APACharacterBase::PossessedBy(AController * NewController)
{
	Super::PossessedBy(NewController);

	if (AbilitySystemComponent)
	{
		AbilitySystemComponent->InitAbilityActorInfo(this, this);
	}

	// ASC MixedMode replication requires that the ASC Owner's Owner be the Controller.
	SetOwner(NewController);
}
```

```c++
void APAPlayerControllerBase::AcknowledgePossession(APawn* P)
{
	Super::AcknowledgePossession(P);

	APACharacterBase* CharacterBase = Cast<APACharacterBase>(P);
	if (CharacterBase)
	{
		CharacterBase->GetAbilitySystemComponent()->InitAbilityActorInfo(CharacterBase, CharacterBase);
	}

	//...
}
```

对于 `ASC` 位于 `PlayerState` 上的玩家控制角色，我通常会在服务器端的 `Pawn::PossessedBy()` 中初始化，并在客户端的 `Pawn::OnRep_PlayerState()` 中初始化。这样可以确保客户端上的 `PlayerState` 已经存在。

```c++
 // Server only
void AGDHeroCharacter::PossessedBy(AController * NewController)
{
	Super::PossessedBy(NewController);

	AGDPlayerState* PS = GetPlayerState<AGDPlayerState>();
	if (PS)
	{
		// Set the ASC on the Server. Clients do this in OnRep_PlayerState()
		AbilitySystemComponent = Cast<UGDAbilitySystemComponent>(PS->GetAbilitySystemComponent());

		// AI won't have PlayerControllers so we can init again here just to be sure. No harm in initing twice for heroes that have PlayerControllers.
		PS->GetAbilitySystemComponent()->InitAbilityActorInfo(PS, this);
	}

	//...
}
```

```c++
 // Client only
void AGDHeroCharacter::OnRep_PlayerState()
{
	Super::OnRep_PlayerState();

	AGDPlayerState* PS = GetPlayerState<AGDPlayerState>();
	if (PS)
	{
		// Set the ASC for clients. Server does this in PossessedBy.
		AbilitySystemComponent = Cast<UGDAbilitySystemComponent>(PS->GetAbilitySystemComponent());

		// Init ASC Actor Info for clients. Server will init its ASC when it possesses a new Actor.
		AbilitySystemComponent->InitAbilityActorInfo(PS, this);
	}

	// ...
}
```

如果你看到错误消息 `LogAbilitySystem: Warning: Can't activate LocalOnly or LocalPredicted ability %s when not local!`，那说明你没有在客户端初始化 `ASC`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gt"></a>
### 4.2 关于 Gameplay Tags
[`FGameplayTags`](https://docs.unrealengine.com/en-US/API/Runtime/GameplayTags/FGameplayTag/index.html) 是以 `Parent.Child.Grandchild...` 这种层级名称形式注册到 `GameplayTagManager` 中的标签。这些标签在分类和描述对象状态时极其有用。例如，如果一个角色被眩晕，我们可以在眩晕持续期间给它添加一个 `State.Debuff.Stun` `GameplayTag`。


你会发现，很多过去用布尔值或枚举处理的事情，最终都会被 `GameplayTags` 替代，而你的逻辑也会变成判断对象是否拥有某些 `GameplayTags`。

给对象添加标签时，如果对象有 `ASC`，我们通常会把标签加到它的 `ASC` 上，以便 GAS 可以与这些标签交互。`UAbilitySystemComponent` 实现了 `IGameplayTagAssetInterface`，提供了访问其所拥有 `GameplayTags` 的函数。

多个 `GameplayTags` 可以存放在一个 `FGameplayTagContainer` 中。相较于使用 `TArray<FGameplayTag>`，更推荐使用 `GameplayTagContainer`，因为 `GameplayTagContainers` 做了一些效率优化。虽然标签本质上是标准 `FNames`，但如果在项目设置中启用了 `Fast Replication`，它们在 `FGameplayTagContainers` 中可以被高效打包并进行 Replication。`Fast Replication` 要求服务器和客户端拥有相同的 `GameplayTags` 列表。通常这不成问题，所以你应该启用这个选项。`GameplayTagContainers` 也可以返回 `TArray<FGameplayTag>` 供遍历使用。

存储在 `FGameplayTagCountContainer` 中的 `GameplayTags` 带有一个 `TagMap`，用于保存该 `GameplayTag` 的实例数量。一个 `FGameplayTagCountContainer` 里可能仍然存在该 `GameplayTag`，但其 `TagMapCount` 为零。调试时如果发现某个 `ASC` 似乎仍然持有某个 `GameplayTag`，你可能会遇到这种情况。任何 `HasTag()`、`HasMatchingTag()` 等类似函数都会检查 `TagMapCount`，如果标签不存在或者其 `TagMapCount` 为零，就会返回 false。

`GameplayTags` 必须预先定义在 `DefaultGameplayTags.ini` 中。Unreal Engine Editor 在项目设置中提供了一个界面，让开发者无需手动编辑 `DefaultGameplayTags.ini` 就能管理 `GameplayTags`。`GameplayTag` 编辑器可以创建、重命名、查找引用以及删除 `GameplayTags`。


搜索 `GameplayTag` 引用会在 Editor 中打开熟悉的 `Reference Viewer` 图表，显示所有引用了该 `GameplayTag` 的资源。不过它不会显示任何引用这个 `GameplayTag` 的 C++ 类。

重命名 `GameplayTags` 时会创建一个 redirect，以便仍然引用旧 `GameplayTag` 的资源可以跳转到新的 `GameplayTag`。如果可以的话，我更倾向于新建一个 `GameplayTag`，手动把所有引用更新到新的 `GameplayTag`，然后删除旧的 `GameplayTag`，以避免产生 redirect。

除了 `Fast Replication` 之外，`GameplayTag` 编辑器还有一个选项，可以填写常见会被 Replication 的 `GameplayTags` 以进一步优化它们。

如果 `GameplayTags` 是通过 `GameplayEffect` 添加的，它们会被 Replication。`ASC` 还允许你添加不会被 Replication 的 `LooseGameplayTags`，这类标签必须手动管理。示例项目使用一个 `LooseGameplayTag` 来表示 `State.Dead`，这样拥有者客户端可以在生命值降到零时立刻作出响应。重生时会手动把 `TagMapCount` 设回零。只有在处理 `LooseGameplayTags` 时才应手动调整 `TagMapCount`。相比手动修改 `TagMapCount`，更推荐使用 `UAbilitySystemComponent::AddLooseGameplayTag()` 和 `UAbilitySystemComponent::RemoveLooseGameplayTag()`。

在 C++ 中获取一个 `GameplayTag` 的引用：

```c++
FGameplayTag::RequestGameplayTag(FName("Your.GameplayTag.Name"))
```

如果你要进行更高级的 `GameplayTag` 操作，例如获取父级或子级 `GameplayTags`，可以查看 `GameplayTagManager` 提供的函数。要访问 `GameplayTagManager`，包含 `GameplayTagManager.h`，然后调用 `UGameplayTagManager::Get().FunctionName`。`GameplayTagManager` 实际上以关系节点（父、子等）的形式存储 `GameplayTags`，因此比持续进行字符串操作和比较更高效。

`GameplayTags` 和 `GameplayTagContainers` 可以带上可选的 `UPROPERTY` 说明符 `Meta = (Categories = "GameplayCue")`，这样在 Blueprint 中就只会显示父标签为 `GameplayCue` 的 `GameplayTags`。当你明确知道某个 `GameplayTag` 或 `GameplayTagContainer` 变量只应该用于 `GameplayCues` 时，这会很有用。

另一种方式是使用一个单独的结构 `FGameplayCueTag`，它封装了一个 `FGameplayTag`，并且会在 Blueprint 中自动过滤，只显示父标签为 `GameplayCue` 的 `GameplayTags`。

如果你想过滤函数中的某个 `GameplayTag` 参数，可以使用 `UFUNCTION` 说明符 `Meta = (GameplayTagFilter = "GameplayCue")`。函数中的 `GameplayTagContainer` 参数则无法这样过滤。如果你想修改引擎来支持它，可以看看 `Engine\Plugins\Editor\GameplayTagsEditor\Source\GameplayTagsEditor\Private\SGameplayTagGraphPin.cpp` 中 `SGameplayTagGraphPin::ParseDefaultValueData()` 如何调用 `FilterString = UGameplayTagsManager::Get().GetCategoriesMetaFromField(PinStructType);`，并在 `SGameplayTagGraphPin::GetListContent()` 中把 `FilterString` 传给 `SGameplayTagWidget`。而 `Engine\Plugins\Editor\GameplayTagsEditor\Source\GameplayTagsEditor\Private\SGameplayTagContainerGraphPin.cpp` 中对应的 `GameplayTagContainer` 版本函数并不会检查这些 meta 字段属性，也不会传递这个过滤器。

示例项目广泛使用了 `GameplayTags`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gt-change"></a>
### 4.2.1 响应 Gameplay Tags 的变化
`ASC` 提供了一个 delegate，用于在 `GameplayTags` 被添加或移除时触发。它接收一个 `EGameplayTagEventType`，可指定只在 `GameplayTag` 被添加/移除时触发，或者在该 `GameplayTag` 的 `TagMapCount` 发生任何变化时触发。

```c++
AbilitySystemComponent->RegisterGameplayTagEvent(FGameplayTag::RequestGameplayTag(FName("State.Debuff.Stun")), EGameplayTagEventType::NewOrRemoved).AddUObject(this, &AGDPlayerState::StunTagChanged);
```

回调函数会接收 `GameplayTag` 和新的 `TagCount` 作为参数。

```c++
virtual void StunTagChanged(const FGameplayTag CallbackTag, int32 NewCount);
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gt-loadfromplugin"></a>
### 4.2.2 从插件 .ini 文件加载 Gameplay Tags
如果你创建了一个插件，并且它有自己包含 `GameplayTags` 的 .ini 文件，那么你可以在插件的 `StartupModule()` 函数中加载该插件的 `GameplayTag` .ini 目录。

例如，Unreal Engine 自带的 CommonConversation 插件就是这样做的：

```c++
void FCommonConversationRuntimeModule::StartupModule()
{
	TSharedPtr<IPlugin> ThisPlugin = IPluginManager::Get().FindPlugin(TEXT("CommonConversation"));
	check(ThisPlugin.IsValid());

	UGameplayTagsManager::Get().AddTagIniSearchPath(ThisPlugin->GetBaseDir() / TEXT("Config") / TEXT("Tags"));

	//...
}
```

这会在引擎启动时查找目录 `Plugins\CommonConversation\Config\Tags`，并在插件启用的情况下，把其中所有带有 `GameplayTags` 的 .ini 文件加载到你的项目里。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-a"></a>
### 4.3 关于 Attributes

<a name="concepts-a-definition"></a>
#### 4.3.1 Attributes 定义
`Attributes` 是由结构体 [`FGameplayAttributeData`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/FGameplayAttributeData/index.html) 定义的 float 值。它们可以表示从角色生命值、角色等级，到药水剩余充能次数等各种内容。只要某个数值属于某个 `Actor`，并且与玩法相关，你就应该考虑把它实现为一个 `Attribute`。通常 `Attributes` 应只通过 [`GameplayEffects`](#concepts-ge) 来修改，这样 ASC 才能对这些变化进行 [Prediction](#concepts-p)。

`Attributes` 由 [`AttributeSet`](#concepts-as) 定义并存储在其中。`AttributeSet` 负责 Replication 被标记为可同步的 `Attributes`。关于如何定义 `Attributes`，请参见 [`AttributeSets`](#concepts-as) 章节。

**提示：** 如果你不想让某个 `Attribute` 出现在 Editor 的 `Attributes` 列表中，可以使用 `Meta = (HideInDetailsView)` `property specifier`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-a-value"></a>
#### 4.3.2 BaseValue 与 CurrentValue
一个 `Attribute` 由两个值组成：`BaseValue` 和 `CurrentValue`。`BaseValue` 是该 `Attribute` 的永久值，而 `CurrentValue` 则是 `BaseValue` 加上来自 `GameplayEffects` 的临时修改。比如，你的 `Character` 可能有一个移动速度 `Attribute`，它的 `BaseValue` 是 600 units/second。因为这时还没有 `GameplayEffects` 修改移动速度，所以 `CurrentValue` 也是 600 u/s。如果角色获得一个临时的 50 u/s 移速增益，那么 `BaseValue` 仍然是 600 u/s，而 `CurrentValue` 会变成 600 + 50，也就是 650 u/s。当这个移速增益结束后，`CurrentValue` 会恢复为 `BaseValue` 的 600 u/s。

很多 GAS 初学者经常会把 `BaseValue` 误认为是某个 `Attribute` 的最大值，并试图这样使用它。这是错误的做法。对于会变化、或者需要在 Ability 或 UI 中引用的最大值，应该把它们当作单独的 `Attributes`。对于写死的最大/最小值，虽然可以通过 `FAttributeMetaData` 定义一个 `DataTable` 来设置这些限制，但 Epic 在该结构体上方的注释里也说明它仍是“work in progress”。更多信息请参见 `AttributeSet.h`。为了避免混淆，我建议：凡是会在 Ability 或 UI 中被引用的最大值，都做成单独的 `Attributes`；而仅用于 clamp `Attributes` 的硬编码最大值与最小值，则在 `AttributeSet` 中定义为硬编码 float。关于 `Attributes` 的 clamp：对于 `CurrentValue` 的变化，请参考 [PreAttributeChange()](#concepts-as-preattributechange)；对于 `GameplayEffects` 引起的 `BaseValue` 变化，请参考 [PostGameplayEffectExecute()](#concepts-as-postgameplayeffectexecute)。

对 `BaseValue` 的永久修改来自 `Instant` `GameplayEffects`，而 `Duration` 和 `Infinite` `GameplayEffects` 修改的是 `CurrentValue`。`Periodic` `GameplayEffects` 会被当作 instant `GameplayEffects` 处理，因此它们修改的也是 `BaseValue`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-a-meta"></a>
有些 `Attributes` 会被当作临时值占位符，用来与其他 `Attributes` 交互。这些就叫做 `Meta Attributes`。例如，我们通常会把 damage 定义成一个 `Meta Attribute`。不是让 `GameplayEffect` 直接修改 health `Attribute`，而是把 damage 作为一个占位值。这样 damage 值就可以在 [`GameplayEffectExecutionCalculation`](#concepts-ge-ec) 中被 buff/debuff 修改，也可以在 `AttributeSet` 中进一步处理，例如先从当前 shield `Attribute` 中扣除 damage，再把剩余值从 health `Attribute` 中扣除。damage 这个 `Meta Attribute` 不会在不同 `GameplayEffects` 之间持久存在，每次都会被新的值覆盖。`Meta Attributes` 通常不会被 Replication。

`Meta Attributes` 为诸如伤害和治疗之类的流程提供了一个很好的逻辑分层：把“我们造成了多少伤害？”和“我们如何处理这份伤害？”分开。这种分离意味着我们的 `Gameplay Effects` 和 `Execution Calculations` 不需要知道目标是如何处理伤害的。继续用伤害举例：`Gameplay Effect` 负责确定伤害数值，而 `AttributeSet` 决定如何处理这些伤害。并不是所有角色都会有同样的 `Attributes`，尤其是在你使用 `AttributeSets` 子类时。基础 `AttributeSet` 类可能只有 health `Attribute`，而某个子类 `AttributeSet` 可能额外增加 shield `Attribute`。拥有 shield `Attribute` 的子类 `AttributeSet`，收到伤害时就会采用不同于基础 `AttributeSet` 类的分配方式。

虽然 `Meta Attributes` 是很好的设计模式，但并不是强制要求。如果你的所有伤害实例都只会用同一个 `Execution Calculation`，并且所有角色也只共享一个 `Attribute Set` 类，那么你也许完全可以直接在 `Execution Calculation` 里完成对 health、shield 等的伤害分配，并直接修改那些 `Attributes`。你牺牲的只是灵活性，但这对你的项目来说可能完全可以接受。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-a-changes"></a>
#### 4.3.4 响应 Attributes 变化
如果你想监听某个 `Attribute` 的变化，以更新 UI 或驱动其他玩法逻辑，可以使用 `UAbilitySystemComponent::GetGameplayAttributeValueChangeDelegate(FGameplayAttribute Attribute)`。这个函数会返回一个 delegate，你可以将它绑定到回调上；只要该 `Attribute` 发生变化，回调就会自动触发。该 delegate 会提供一个 `FOnAttributeChangeData` 参数，其中包含 `NewValue`、`OldValue` 和 `FGameplayEffectModCallbackData`。**注意：** `FGameplayEffectModCallbackData` 只会在服务器上有值。

```c++
AbilitySystemComponent->GetGameplayAttributeValueChangeDelegate(AttributeSetBase->GetHealthAttribute()).AddUObject(this, &AGDPlayerState::HealthChanged);
```

```c++
virtual void HealthChanged(const FOnAttributeChangeData& Data);
```

示例项目在 `GDPlayerState` 上绑定了这些 `Attribute` 值变化的 delegates，用于更新 HUD，并在生命值降到零时响应玩家死亡。

示例项目中还包含了一个自定义 Blueprint 节点，它把这件事包装成了一个 `ASyncTask`。该节点在 `UI_HUD` 的 UMG Widget 中用于更新 health、mana 和 stamina 数值。这个 `AsyncTask` 会一直存活，直到你手动调用 `EndTask()`；我们在 UMG Widget 的 `Destruct` 事件中这么做。见 `AsyncTaskAttributeChanged.h/cpp`。


**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-a-derived"></a>
#### 4.3.5 派生 Attributes
如果你想创建一个 `Attribute`，让它的全部或部分值从一个或多个其他 `Attributes` 派生而来，可以使用一个带有一个或多个 `Attribute Based` 或 [`MMC`](#concepts-ge-mmc) [`Modifiers`](#concepts-ge-mods) 的 `Infinite` `GameplayEffect`。当它依赖的某个 `Attribute` 更新时，这个 `Derived Attribute` 会自动更新。

应用到 `Derived Attribute` 上的所有 `Modifiers` 最终采用的公式，与 `Modifier Aggregators` 的公式相同。如果你需要按特定顺序执行计算，请把所有逻辑都放进一个 `MMC` 里。

```
((CurrentValue + Additive) * Multiplicitive) / Division
```

**注意：** 如果你在 PIE 中使用多个客户端测试，需要在 Editor Preferences 中关闭 `Run Under One Process`，否则除了第一个客户端之外，其余客户端上的 `Derived Attributes` 不会在其依赖 `Attributes` 变化时自动更新。

在这个例子里，我们使用一个 `Infinite` `GameplayEffect`，让 `TestAttrA` 的值从 `TestAttrB` 和 `TestAttrC` 这两个 `Attributes` 派生，公式是 `TestAttrA = (TestAttrA + TestAttrB) * ( 2 * TestAttrC)`。每当其中任意一个 `Attribute` 的值发生变化时，`TestAttrA` 都会自动重新计算。


**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-as"></a>
### 4.4 关于 Attribute Set

<a name="concepts-as-definition"></a>
#### 4.4.1 Attribute Set 定义
`AttributeSet` 用于定义、保存并管理 `Attributes` 的变化。开发者应该从 [`UAttributeSet`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/UAttributeSet/index.html) 继承创建子类。在 `OwnerActor` 的构造函数中创建 `AttributeSet` 会自动把它注册到对应的 `ASC` 上。**这一步必须在 C++ 中完成。**

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-as-design"></a>
#### 4.4.2 Attribute Set 设计
一个 `ASC` 可以拥有一个或多个 `AttributeSets`。`AttributeSets` 的内存开销几乎可以忽略不计，因此使用多少个 `AttributeSets` 更多是一个组织结构上的决定，由开发者自行权衡。

你完全可以只使用一个大型的、单体式 `AttributeSet`，让游戏里每个 `Actor` 都共享它；需要时使用其中的属性，不需要时就忽略未使用的属性。

另一种做法是使用多个 `AttributeSet`，按 `Attributes` 的分组来组织，并根据需要有选择地加到不同的 `Actors` 上。例如，你可以有一个负责生命相关 `Attributes` 的 `AttributeSet`，一个负责法力相关 `Attributes` 的 `AttributeSet`，等等。在 MOBA 游戏里，英雄可能需要法力，而小兵可能不需要。因此英雄会获得 mana `AttributeSet`，而小兵不会。

此外，你还可以通过继承 `AttributeSets` 的方式，有选择地决定某个 `Actor` 拥有哪些 `Attributes`。内部表示时，`Attributes` 的名称格式是 `AttributeSetClassName.AttributeName`。当你继承一个 `AttributeSet` 时，父类里的所有 `Attributes` 仍然会继续使用父类名作为前缀。

虽然你可以拥有多个 `AttributeSet`，但你不应该在同一个 `ASC` 上放置多个同类 `AttributeSet`。如果同一类 `AttributeSet` 存在多个实例，系统不知道该使用哪一个，最终只会随意选一个。

<a name="concepts-as-design-subcomponents"></a>
##### 4.4.2.1 带独立 Attributes 的子组件
在某些场景中，一个 `Pawn` 可能带有多个可受伤的组件，比如可分别被破坏的护甲部件。如果你知道一个 `Pawn` 最多会有多少个这类可受伤组件，我建议在一个 `AttributeSet` 上预先定义那么多个 health `Attributes`，例如 `DamageableCompHealth0`、`DamageableCompHealth1` 等，把它们当作这些可受伤组件对应的逻辑“槽位”。在你的可受伤组件实例类中，分配一个槽位编号 `Attribute`，这样 `GameplayAbilities` 或 [`Executions`](#concepts-ge-ec) 就能读取这个编号，并知道该把伤害作用到哪个 `Attribute` 上。拥有少于最大数量、甚至完全没有这类组件的 `Pawns` 也没有问题。`AttributeSet` 里有某个 `Attribute`，并不意味着你必须用它。未使用的 `Attributes` 只占用极少的内存。

如果你的子组件每个都需要很多 `Attributes`、子组件数量理论上没有上限、子组件可以拆下并被其他玩家使用（例如武器），或者出于其他原因这个方案不适合你，那么我建议不要再使用 `Attributes`，而是直接在这些组件上存储普通 float。见 [物品](#concepts-as-design-itemattributes)。

<a name="concepts-as-design-addremoveruntime"></a>
##### 4.4.2.2 运行时添加和移除 AttributeSets
`AttributeSets` 可以在运行时被添加到 `ASC` 或从中移除；不过，移除 `AttributeSets` 可能很危险。比如说，如果客户端先于服务器移除了某个 `AttributeSet`，而这时服务器又把某个 `Attribute` 的值变化 Replication 到客户端，那么该 `Attribute` 在客户端上就找不到自己的 `AttributeSet`，从而导致游戏崩溃。

武器加入背包时：

```c++
AbilitySystemComponent->GetSpawnedAttributes_Mutable().AddUnique(WeaponAttributeSetPointer);
AbilitySystemComponent->ForceReplication();
```

武器从背包移除时：

```c++
AbilitySystemComponent->GetSpawnedAttributes_Mutable().Remove(WeaponAttributeSetPointer);
AbilitySystemComponent->ForceReplication();
```

<a name="concepts-as-design-itemattributes"></a>
##### 4.4.2.3 物品 Attributes（武器弹药）
实现可装备物品的 `Attributes`（武器弹药、护甲耐久等）有几种方式。这几种方式都会把数值直接存储在物品本身上。这对于那些生命周期内可能被多个玩家装备过的物品来说是必须的。

> 1. 在物品上使用普通 float（**推荐**）
> 1. 在物品上放置独立的 `AttributeSet`
> 1. 在物品上放置独立的 `ASC`

<a name="concepts-as-design-itemattributes-plainfloats"></a>
###### 4.4.2.3.1 物品上的普通 float
与其使用 `Attributes`，不如直接在物品类实例上存储普通 float 值。Fortnite 和 [GASShooter](https://github.com/tranek/GASShooter) 都是这样处理枪械弹药的。对于一把枪，你可以直接在枪实例上用可 Replication 的 float（`COND_OwnerOnly`）保存弹匣最大容量、当前弹匣子弹数、备用弹药等。如果多个武器共享备用弹药，那么你应当把备用弹药移动到角色身上，作为共享弹药 `AttributeSet` 中的一个 `Attribute`（装填 Ability 可以使用 `Cost GE`，把共享备用弹药扣除并补到枪的 float 弹匣子弹数中）。因为当前弹匣子弹数不再使用 `Attributes`，你需要重写 `UGameplayAbility` 中的一些函数，以便基于枪上的 float 来检查和应用消耗。若在授予 Ability 时，把枪设置为 [`GameplayAbilitySpec`](https://github.com/tranek/GASDocumentation#concepts-ga-spec) 的 `SourceObject`，那么在 Ability 内部你就能访问到这把授予该 Ability 的枪。

为了防止自动射击期间，枪械把 ammo 数量 Replication 回本地并覆盖本地 ammo 数值，可以在 `PreReplication()` 中，当玩家拥有 `IsFiring` `GameplayTag` 时禁用这部分 Replication。本质上你是在自己实现一套本地 Prediction。

```c++
void AGSWeapon::PreReplication(IRepChangedPropertyTracker& ChangedPropertyTracker)
{
	Super::PreReplication(ChangedPropertyTracker);

	DOREPLIFETIME_ACTIVE_OVERRIDE(AGSWeapon, PrimaryClipAmmo, (IsValid(AbilitySystemComponent) && !AbilitySystemComponent->HasMatchingGameplayTag(WeaponIsFiringTag)));
	DOREPLIFETIME_ACTIVE_OVERRIDE(AGSWeapon, SecondaryClipAmmo, (IsValid(AbilitySystemComponent) && !AbilitySystemComponent->HasMatchingGameplayTag(WeaponIsFiringTag)));
}
```

优点：

1. 避免使用 `AttributeSets` 的限制（见下文）

限制：

1. 不能直接使用现有的 `GameplayEffect` 工作流（例如使用 `Cost GEs` 扣除弹药等）
1. 需要额外重写 `UGameplayAbility` 中的关键函数，才能基于枪上的 float 检查和应用弹药消耗

<a name="concepts-as-design-itemattributes-attributeset"></a>
###### 4.4.2.3.2 物品上的 `AttributeSet`
在物品上使用独立的 `AttributeSet`，并在[物品加入玩家背包时把它添加到玩家的 `ASC`](#concepts-as-design-addremoveruntime) 中，这种做法是可行的，但有几个很大的限制。在早期版本的 [GASShooter](https://github.com/tranek/GASShooter) 中，我就是这样处理武器弹药的。武器把诸如弹匣最大容量、当前弹匣子弹数、备用弹药等 `Attributes` 存在一个挂在武器类上的 `AttributeSet` 里。如果多个武器共享备用弹药，那么你应该把备用弹药移到角色身上，放在一个共享弹药 `AttributeSet` 中。当武器在服务器上加入玩家背包时，武器会把自己的 `AttributeSet` 加到玩家 `ASC::SpawnedAttributes` 中。随后服务器会把这件事 Replication 给客户端。如果武器从背包中移除，它也会把自己的 `AttributeSet` 从 `ASC::SpawnedAttributes` 中移除。

当 `AttributeSet` 挂在 `OwnerActor` 之外的对象上（比如武器）时，你一开始通常会在 `AttributeSet` 中遇到一些编译错误。解决办法是在 `BeginPlay()` 而不是构造函数中创建 `AttributeSet`，并且在武器上实现 `IAbilitySystemInterface`（当武器加入玩家背包时，把 `ASC` 指针设置进去）。

```c++
void AGSWeapon::BeginPlay()
{
	if (!AttributeSet)
	{
		AttributeSet = NewObject<UGSWeaponAttributeSet>(this);
	}
	//...
}
```

如果你想看实际实现，可以查看这个 [GASShooter 的旧版本](https://github.com/tranek/GASShooter/tree/df5949d0dd992bd3d76d4a728f370f2e2c827735)。

优点：

1. 可以使用现有的 `GameplayAbility` 和 `GameplayEffect` 工作流（例如用 `Cost GEs` 扣除弹药）
1. 对于非常少量的物品，设置起来较简单

限制：

1. 你必须为每种武器类型新建一个 `AttributeSet` 类。`ASCs` 实际上只能有效使用某个类的一个 `AttributeSet` 实例，因为当某个 `Attribute` 发生变化时，系统会在 `ASCs` 的 `SpawnedAttributes` 数组中查找该 `AttributeSet` 类的第一个实例。后续同类 `AttributeSet` 实例都会被忽略。
1. 由于上一个原因，玩家背包里每种武器类型只能有一把，因为每个 `AttributeSet` 类只能有一个实例。
1. 移除一个 `AttributeSet` 是危险的。在 GASShooter 中，如果玩家被自己的火箭炸死，系统会立刻把火箭发射器从背包里移除（包括把它的 `AttributeSet` 从 `ASC` 中移除）。当服务器随后 Replication 火箭发射器的 ammo `Attribute` 变化时，客户端 `ASC` 上已经没有对应的 `AttributeSet` 了，游戏就崩溃了。

<a name="concepts-as-design-itemattributes-asc"></a>
###### 4.4.2.3.3 物品上的 `ASC`
给每个物品都挂一个完整的 `AbilitySystemComponent` 是一种非常极端的做法。我自己没有这么做过，也没在实际项目中见过。这会需要相当多的工程投入才能运转起来。

> 让多个 AbilitySystemComponents 共享同一个 owner、但拥有不同的 avatars，是否可行？（例如 pawn、weapon、items、projectiles 上都有，各自的 Owner 都指向 PlayerState）
>
>
> 我首先看到的问题会是：在 owning actor 上实现 `IGameplayTagAssetInterface` 和 `IAbilitySystemInterface`。前者也许可行：只需要把所有 ASC 的 tags 聚合起来（不过要注意，`HasAllMatchingGameplayTags` 可能只有在跨 ASC 聚合时才成立。不能只是简单把调用转发到每个 ASC，再把结果 OR 起来）。但后者更棘手：到底哪个 ASC 才是权威的？如果有人想应用一个 GE，应该交给哪一个来接收？也许你能把这些问题解决掉，但这部分会是最难的：owners 下面会挂着多个 ASC。
>
>
> 不过，把独立的 ASC 放在 pawn 和 weapon 上，本身倒是可能说得通。比如，把描述 weapon 的 tags 和描述拥有它的 pawn 的 tags 分开。也许让授予给 weapon 的 tags 同样“作用于” owner，而其他内容（例如 attributes 和 GEs）仍然保持独立，同时 owner 聚合这些 owned tags，像我上面描述的那样，这确实可能可行。我相信这是能做出来的。但让多个 ASC 共享同一个 owner 可能会变得很棘手。
>

*Dave Ratti（Epic）对[社区问题 #6](https://epicgames.ent.box.com/s/m1egifkxv3he3u3xezb9hzbgroxyhx89) 的回答*

优点：

1. 可以使用现有的 `GameplayAbility` 和 `GameplayEffect` 工作流（例如用 `Cost GEs` 扣除弹药）
1. 可以复用 `AttributeSet` 类（每个武器 ASC 上挂一个）

限制：

1. 工程成本未知
1. 这件事究竟是否可行都还不确定

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-as-attributes"></a>
#### 4.4.3 定义 Attributes
**`Attributes` 只能在 C++ 中定义**，并且定义位置在 `AttributeSet` 的头文件中。建议在每个 `AttributeSet` 头文件顶部加上这一组宏。它会自动为你的 `Attributes` 生成 getter 和 setter 函数。

```c++
 // Uses macros from AttributeSet.h
#define ATTRIBUTE_ACCESSORS(ClassName, PropertyName) \
	GAMEPLAYATTRIBUTE_PROPERTY_GETTER(ClassName, PropertyName) \
	GAMEPLAYATTRIBUTE_VALUE_GETTER(PropertyName) \
	GAMEPLAYATTRIBUTE_VALUE_SETTER(PropertyName) \
	GAMEPLAYATTRIBUTE_VALUE_INITTER(PropertyName)
```

一个会进行 Replication 的 health `Attribute` 可以这样定义：

```c++
UPROPERTY(BlueprintReadOnly, Category = "Health", ReplicatedUsing = OnRep_Health)
FGameplayAttributeData Health;
ATTRIBUTE_ACCESSORS(UGDAttributeSetBase, Health)
```

还要在头文件里定义 `OnRep` 函数：

```c++
UFUNCTION()
virtual void OnRep_Health(const FGameplayAttributeData& OldHealth);
```

在 `AttributeSet` 的 .cpp 文件中，应当用 Prediction 系统使用的 `GAMEPLAYATTRIBUTE_REPNOTIFY` 宏来实现 `OnRep` 函数：

```c++
void UGDAttributeSetBase::OnRep_Health(const FGameplayAttributeData& OldHealth)
{
	GAMEPLAYATTRIBUTE_REPNOTIFY(UGDAttributeSetBase, Health, OldHealth);
}
```

最后，还需要把这个 `Attribute` 加入 `GetLifetimeReplicatedProps`：

```c++
void UGDAttributeSetBase::GetLifetimeReplicatedProps(TArray<FLifetimeProperty>& OutLifetimeProps) const
{
	Super::GetLifetimeReplicatedProps(OutLifetimeProps);

	DOREPLIFETIME_CONDITION_NOTIFY(UGDAttributeSetBase, Health, COND_None, REPNOTIFY_Always);
}
```

`REPNOTIFY_Always` 的含义是：即便本地值因为 Prediction 已经等于服务器 Replication 下来的值，也依然会触发 `OnRep`。默认情况下，如果本地值和服务器传下来的值相同，`OnRep` 是不会触发的。

如果这个 `Attribute` 不需要 Replication，比如 `Meta Attribute`，那么 `OnRep` 和 `GetLifetimeReplicatedProps` 这两步就可以省略。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-as-init"></a>
#### 4.4.4 初始化 Attributes
初始化 `Attributes`（设置它们的 `BaseValue`，并因此使 `CurrentValue` 也拥有某个初始值）有多种方式。Epic 推荐使用一个 instant `GameplayEffect`。示例项目也采用了这种方式。

如何创建一个用于初始化 `Attributes` 的 instant `GameplayEffect`，请查看示例项目中的 `GE_HeroAttributes` Blueprint。这个 `GameplayEffect` 的应用是在 C++ 中完成的。

如果你在定义 `Attributes` 时使用了 `ATTRIBUTE_ACCESSORS` 宏，那么 `AttributeSet` 会自动为每个 `Attribute` 生成一个初始化函数，你可以在 C++ 中随时调用。

```c++
 // InitHealth(float InitialValue) is an automatically generated function for an Attribute 'Health' defined with the `ATTRIBUTE_ACCESSORS` macro
AttributeSet->InitHealth(100.0f);
```

更多初始化 `Attributes` 的方式，请查看 `AttributeSet.h`。

**注意：** 在 4.24 之前，`FAttributeSetInitterDiscreteLevels` 不能和 `FGameplayAttributeData` 一起工作。它是在 `Attributes` 还是原始 float 时创建的，因此会抱怨 `FGameplayAttributeData` 不是 `Plain Old Data`（`POD`）。这个问题已在 4.24 中修复：https://issues.unrealengine.com/issue/UE-76557。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-as-preattributechange"></a>
`PreAttributeChange(const FGameplayAttribute& Attribute, float& NewValue)` 是 `AttributeSet` 中响应 `Attribute` 的 `CurrentValue` 变化、且发生在变化之前的主要函数之一。它是通过引用参数 `NewValue` 对即将到来的 `CurrentValue` 变化进行 clamp 的理想位置。

例如，在示例项目中，对移动速度 modifiers 的 clamp 是这样做的：

```c++
if (Attribute == GetMoveSpeedAttribute())
{
	// Cannot slow less than 150 units/s and cannot boost more than 1000 units/s
	NewValue = FMath::Clamp<float>(NewValue, 150, 1000);
}
```

`GetMoveSpeedAttribute()` 函数是由我们加入到 `AttributeSet.h` 中的宏块生成的（见 [定义](#concepts-as-attributes)）。

无论 `Attributes` 的变化来自 `Attribute` setters（由 `AttributeSet.h` 中的宏块定义，见 [定义](#concepts-as-attributes)）还是来自 [`GameplayEffects`](#concepts-ge)，这里都会被触发。

**注意：** 在这里做的任何 clamp 都不会永久修改 `ASC` 上的 modifier 本身。它只会改变查询 modifier 时返回的值。这意味着，任何会根据全部 modifiers 重新计算 `CurrentValue` 的地方，例如 [`GameplayEffectExecutionCalculations`](#concepts-ge-ec) 和 [`ModifierMagnitudeCalculations`](#concepts-ge-mmc)，都需要再次实现 clamp 逻辑。

**注意：** Epic 对 `PreAttributeChange()` 的注释中提到，不要用它来触发玩法事件，而应主要用于 clamp。对 `Attribute` 变化响应玩法事件的推荐位置，是 `UAbilitySystemComponent::GetGameplayAttributeValueChangeDelegate(FGameplayAttribute Attribute)`（见 [响应 Attributes 变化](#concepts-a-changes)）。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-as-postgameplayeffectexecute"></a>
`PostGameplayEffectExecute(const FGameplayEffectModCallbackData & Data)` 只会在 instant [`GameplayEffect`](#concepts-ge) 修改某个 `Attribute` 的 `BaseValue` 之后触发。当 `Attributes` 因某个 `GameplayEffect` 而发生变化时，这里是进一步处理它们的合适位置。

例如，在示例项目里，我们会在这里把最终的 damage `Meta Attribute` 从 health `Attribute` 中扣掉。如果存在 shield `Attribute`，就会先从 shield 中扣除伤害，再把剩余值从 health 中扣除。示例项目还会在这里触发受击反应动画、显示飘字伤害数字，并把经验和金币赏金分配给击杀者。按照设计，damage `Meta Attribute` 总是通过 instant `GameplayEffect` 进入，而不会通过 `Attribute` setter。

对于 mana、stamina 这类只会被 instant `GameplayEffects` 修改 `BaseValue` 的其他 `Attributes`，也可以在这里把它们 clamp 到与之对应的最大值 `Attributes`。

**注意：** 当 `PostGameplayEffectExecute()` 被调用时，`Attribute` 的变化已经发生，但还没有 Replication 回客户端，因此在这里进行 clamp 不会导致客户端收到两次网络更新。客户端只会在 clamp 完成后收到更新。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-as-onattributeaggregatorcreated"></a>
`OnAttributeAggregatorCreated(const FGameplayAttribute& Attribute, FAggregator* NewAggregator)` 会在该集合中的某个 `Attribute` 创建 `Aggregator` 时触发。它允许你自定义 [`FAggregatorEvaluateMetaData`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/FAggregatorEvaluateMetaData/index.html) 的设置。`AggregatorEvaluateMetaData` 由 `Aggregator` 用于根据所有作用其上的 [`Modifiers`](#concepts-ge-mods) 来计算 `Attribute` 的 `CurrentValue`。默认情况下，`AggregatorEvaluateMetaData` 只用于决定哪些 `Modifiers` 具备参与计算的资格。一个典型例子是 `MostNegativeMod_AllPositiveMods`：它允许所有正向 `Modifiers` 生效，但负向 `Modifiers` 中只允许“最负”的那个生效。Paragon 就用它来实现：无论玩家身上同时存在多少个减速效果，都只应用其中最强的那个负向移速效果，而所有正向移速增益都会生效。不符合资格的 `Modifiers` 仍然存在于 `ASC` 中，只是不会被聚合到最终的 `CurrentValue` 里。一旦条件变化，它们未来仍可能重新具备资格；例如当当前“最负”的那个 `Modifier` 过期后，下一个最负的 `Modifier`（如果存在）就会变成合格项。

下面这个例子展示了如何通过 AggregatorEvaluateMetaData 实现“只允许最强负向 `Modifier` 和所有正向 `Modifiers` 生效”：

```c++
virtual void OnAttributeAggregatorCreated(const FGameplayAttribute& Attribute, FAggregator* NewAggregator) const override;
```

```c++
void UGSAttributeSetBase::OnAttributeAggregatorCreated(const FGameplayAttribute& Attribute, FAggregator* NewAggregator) const
{
	Super::OnAttributeAggregatorCreated(Attribute, NewAggregator);

	if (!NewAggregator)
	{
		return;
	}

	if (Attribute == GetMoveSpeedAttribute())
	{
		NewAggregator->EvaluationMetaData = &FAggregatorEvaluateMetaDataLibrary::MostNegativeMod_AllPositiveMods;
	}
}
```

你自定义的、用于 qualifier 的 `AggregatorEvaluateMetaData` 应该作为静态变量添加到 `FAggregatorEvaluateMetaDataLibrary` 中。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge"></a>

### 4.5 关于 Gameplay Effects

<a name="concepts-ge-definition"></a>
#### 4.5.1 Gameplay Effect 定义
[`GameplayEffects`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/UGameplayEffect/index.html)（`GE`）是 abilities 用来改变自身和其他对象上的 [`Attributes`](#concepts-a) 与 [`GameplayTags`](#concepts-gt) 的载体。它们既可以造成即时的 `Attribute` 变化，例如伤害或治疗，也可以施加长期状态 buff/debuff，例如移动速度提升或眩晕。`UGameplayEffect` 类应当是一个**纯数据**类，用于定义单个 gameplay effect。不应向 `GameplayEffects` 中添加额外逻辑。通常设计师会创建许多 `UGameplayEffect` 的 Blueprint 子类。


`GameplayEffects` 通过 [`Modifiers`](#concepts-ge-mods) 和 [`Executions`（`GameplayEffectExecutionCalculation`）](#concepts-ge-ec) 来改变 `Attributes`。

`GameplayEffects` 有三种持续时间类型：`Instant`、`Duration` 和 `Infinite`。

另外，`GameplayEffects` 还可以添加/执行 [`GameplayCues`](#concepts-gc)。`Instant` `GameplayEffect` 会对 `GameplayCue` `GameplayTags` 调用 `Execute`，而 `Duration` 或 `Infinite` `GameplayEffect` 会对 `GameplayCue` `GameplayTags` 调用 `Add` 和 `Remove`。

|持续时间类型|事件|何时使用|
| -------------| -----------------| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Instant`| Execute| 用于对 `Attribute` 的 `BaseValue` 做立即且永久的修改。`GameplayTags` 不会被应用，哪怕只有一帧也不会。|
| `Duration`| Add & Remove| 用于临时修改 `Attribute` 的 `CurrentValue`，以及应用会在 `GameplayEffect` 过期或被手动移除时移除的 `GameplayTags`。持续时间在 `UGameplayEffect` 类|
| `Infinite`| Add & Remove| 用于临时修改 `Attribute` 的 `CurrentValue`，以及应用会在 `GameplayEffect` 被移除时移除的 `GameplayTags`。它们不会自行过期，必须由某个 ability 或 `ASC` 手动移除。|

`Duration` 和 `Infinite` `GameplayEffects` 可以选择应用 `Periodic Effects`，即按照其 `Period` 定义的每 `X` 秒执行一次其 `Modifiers` 和 `Executions`。在修改 `Attribute` 的 `BaseValue` 以及执行 `GameplayCues` 时，`Periodic Effects` 会被当作 `Instant` `GameplayEffects` 处理。这对于持续伤害（DOT）类效果很有用。**注意：**`Periodic Effects` 不能被 [predicted](#concepts-p)。

`Duration` 和 `Infinite` `GameplayEffects` 在应用之后，如果其 `Ongoing Tag Requirements` 不满足/满足条件，还可以被临时关闭和重新开启（见 [Gameplay Effect Tags](#concepts-ge-tags)）。关闭一个 `GameplayEffect` 会移除其 `Modifiers` 和已应用的 `GameplayTags` 的效果，但不会移除这个 `GameplayEffect` 本身。重新开启该 `GameplayEffect` 时，会重新应用其 `Modifiers` 和 `GameplayTags`。

如果你需要手动重新计算某个 `Duration` 或 `Infinite` `GameplayEffect` 的 `Modifiers`（例如你有一个 `MMC` 使用的数据并不来自 `Attributes`），你可以调用 `UAbilitySystemComponent::ActiveGameplayEffects.SetActiveGameplayEffectLevel(FActiveGameplayEffectHandle ActiveHandle, int32 NewLevel)`，并传入它当前已有的相同 level，该 level 可通过 `UAbilitySystemComponent::ActiveGameplayEffects.GetActiveGameplayEffect(ActiveHandle).Spec.GetLevel()` 获取。基于后备 `Attributes` 的 `Modifiers` 会在这些后备 `Attributes` 更新时自动更新。`SetActiveGameplayEffectLevel()` 用于更新 `Modifiers` 的关键函数如下：

```C++
MarkItemDirty(Effect);
Effect.Spec.CalculateModifierMagnitudes();
// Private function otherwise we'd call these three functions without needing to set the level to what it already is
UpdateAllAggregatorModMagnitudes(Effect);
```

`GameplayEffects` 通常不会被直接实例化。当一个 ability 或 `ASC` 想要应用某个 `GameplayEffect` 时，它会从该 `GameplayEffect` 的 `ClassDefaultObject` 创建一个 [`GameplayEffectSpec`](#concepts-ge-spec)。成功应用的 `GameplayEffectSpecs` 随后会被加入到一个名为 `FActiveGameplayEffect` 的新结构体中，而这正是 `ASC` 在一个名为 `ActiveGameplayEffects` 的特殊容器结构体中跟踪的对象。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-applying"></a>
#### 4.5.2 应用
`GameplayEffects` 可以通过 [`GameplayAbilities`](#concepts-ga) 上的函数以及 `ASC` 上的函数以多种方式应用，通常表现为 `ApplyGameplayEffectTo` 这一类函数。不同函数本质上都是便捷封装，最终通常都会在 `Target` 上调用 `UAbilitySystemComponent::ApplyGameplayEffectSpecToSelf()`。

如果要在 `GameplayAbility` 之外应用 `GameplayEffects`，例如从一个 projectile 中应用，你需要获取 `Target` 的 `ASC`，然后使用其某个 `ApplyGameplayEffectToSelf` 函数。

你可以通过绑定其 delegate，监听任意 `Duration` 或 `Infinite` `GameplayEffects` 被应用到某个 `ASC` 上的事件：

```c++
AbilitySystemComponent->OnActiveGameplayEffectAddedDelegateToSelf.AddUObject(this, &APACharacterBase::OnActiveGameplayEffectAddedCallback);
```

回调函数：

```c++
virtual void OnActiveGameplayEffectAddedCallback(UAbilitySystemComponent* Target, const FGameplayEffectSpec& SpecApplied, FActiveGameplayEffectHandle ActiveHandle);
```

无论使用哪种 Replication 模式，服务器都会始终调用这个函数。autonomous proxy 只会在 `Full` 和 `Mixed` Replication 模式下，对已复制的 `GameplayEffects` 调用它。simulated proxy 则只会在 `Full` [Replication 模式](#concepts-asc-rm)下调用它。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-removing"></a>
#### 4.5.3 移除
`GameplayEffects` 可以通过 [`GameplayAbilities`](#concepts-ga) 上的函数以及 `ASC` 上的函数以多种方式移除，通常表现为 `RemoveActiveGameplayEffect` 这一类函数。不同函数本质上都是便捷封装，最终通常都会在 `Target` 上调用 `FActiveGameplayEffectsContainer::RemoveActiveEffects()`。

如果要在 `GameplayAbility` 之外移除 `GameplayEffects`，你需要获取 `Target` 的 `ASC`，然后使用其某个 `RemoveActiveGameplayEffect` 函数。

你可以通过绑定其 delegate，监听任意 `Duration` 或 `Infinite` `GameplayEffects` 从某个 `ASC` 上移除的事件：

```c++
AbilitySystemComponent->OnAnyGameplayEffectRemovedDelegate().AddUObject(this, &APACharacterBase::OnRemoveGameplayEffectCallback);
```

回调函数：

```c++
virtual void OnRemoveGameplayEffectCallback(const FActiveGameplayEffect& EffectRemoved);
```

无论使用哪种 Replication 模式，服务器都会始终调用这个函数。autonomous proxy 只会在 `Full` 和 `Mixed` Replication 模式下，对已复制的 `GameplayEffects` 调用它。simulated proxy 则只会在 `Full` [Replication 模式](#concepts-asc-rm)下调用它。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-mods"></a>
`Modifiers` 会改变一个 `Attribute`，并且它们是唯一可以[预测式地](#concepts-p)改变 `Attribute` 的方式。一个 `GameplayEffect` 可以有零个或多个 `Modifiers`。每个 `Modifier` 只负责通过某个指定操作改变一个 `Attribute`。

|操作|描述|
| ----------| -------------------------------------------------------------------------------------------------------------------|
| `Add`| 将结果加到 `Modifier` 指定的 `Attribute` 上。要做减法时请使用负值。|
| `Multiply`| 将结果乘到 `Modifier` 指定的 `Attribute` 上。|
| `Divide`| 将结果用于除以 `Modifier` 指定的 `Attribute`。|
| `Override`| 使用该结果覆盖 `Modifier` 指定的 `Attribute`。|

一个 `Attribute` 的 `CurrentValue` 是其所有 `Modifiers` 与其 `BaseValue` 聚合后的结果。`Modifiers` 的聚合公式在 `GameplayEffectAggregator.cpp` 的 `FAggregatorModChannel::EvaluateWithBase` 中定义如下：

```c++
((InlineBaseValue + Additive) * Multiplicitive) / Division
```

任何 `Override` `Modifiers` 都会覆盖最终值，并且最后应用的 `Modifier` 具有最高优先级。

**注意：**对于基于百分比的变化，请确保使用 `Multiply` 操作，这样它会发生在加法之后。

**注意：**[Prediction](#concepts-p) 对百分比变化的支持存在问题。

`Modifiers` 有四种类型：Scalable Float、Attribute Based、Custom Calculation Class 和 Set By Caller。它们都会生成某个 float 值，然后根据其操作方式用于改变 `Modifier` 所指定的 `Attribute`。

|类型|描述|
| --------------------------| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Scalable Float`|是一种结构体，可以指向一个 Data Table，其中变量作为行、levels 作为列。Scalable Floats 会自动读取指定表行在当前 ability level（或在 [`GameplayEffectSpec`](#concepts-ge-spec) 上覆盖后的其他 level）下的值。这个值还可以通过一个 coefficient 进一步处理。如果没有指定 Data Table|
| `Attribute Based`|会读取 `Source`（创建 `GameplayEffectSpec` 的对象）或 `Target`（接收 `GameplayEffectSpec` 的对象）上的某个后备 `Attribute` 的 `CurrentValue` 或 `BaseValue`，并通过 coefficient 以及 coefficient 前后附加值做进一步处理。`Snapshotting` 表示在创建 `GameplayEffectSpec` 时捕获该后备 `Attribute`；不使用 snapshotting 则表示在应用 `GameplayEffectSpec` 时才捕获该 `Attribute`。<br>`Attribute Based` `Modifiers` take the `CurrentValue` or `BaseValue` of a backing `Attribute` on the `Source` (who created the `GameplayEffectSpec`) or `Target` (who received the `GameplayEffectSpec`) and further modifies it with a coefficient and pre and post coefficient additions. `Snapshotting` means the backing `Attribute` is captured when the `GameplayEffectSpec` is created whereas no snapshotting means the `Attribute` is captured when the `GameplayEffectSpec` is applied.|
| `Custom Calculation Class`|为复杂 `Modifiers` 提供了最高的灵活性。该 `Modifier` 使用一个 [`ModifierMagnitudeCalculation`](#concepts-ge-mmc) 类，并且还可以通过 coefficient 与 coefficient 前后附加值对结果 float 值做进一步处理。<br>`Custom Calculation Class` provides the most flexibility for complex `Modifiers`. This `Modifier` takes a [`ModifierMagnitudeCalculation`](#concepts-ge-mmc) class and can further manipulate the resulting float value with a coefficient and pre and post coefficient additions.|
| `Set By Caller`|是在运行时由 ability 或创建 `GameplayEffectSpec` 的对象，在 `GameplayEffectSpec` 上于 `GameplayEffect` 外部设置的值。例如，如果你希望伤害取决于玩家按住按钮为 ability 蓄力的时长，就可以使用 `SetByCaller`。`SetByCallers` 本质上是存活在 `GameplayEffectSpec` 上的 `TMap<FGameplayTag, float>`。这个 `Modifier` 只是告诉 `Aggregator` 去查找与提供的 `GameplayTag` 关联的 `SetByCaller` 值。被 `Modifiers` 使用的 `SetByCallers` 只能使用该概念的 `GameplayTag` 版本，`FName` 版本在这里被禁用。如果 `Modifier` 被设置为 `SetByCaller`，但 `GameplayEffectSpec` 上不存在具有正确 `GameplayTag` 的 `SetByCaller`，游戏会在运行时抛出错误并返回值 0。这在 `Divide` 操作中可能造成问题。关于如何使用 `SetByCallers` 的更多信息，请参见 [`SetByCallers`](#concepts-ge-spec-setbycaller)。<br>`SetByCaller` `Modifiers` are values that are set outside of the `GameplayEffect` at runtime by the ability or whoever made the `GameplayEffectSpec` on the `GameplayEffectSpec`. For example, you would use a `SetByCaller` if you want to set the damage to be based on how long the player held down a button to charge the ability. `SetByCallers` are essentially `TMap<FGameplayTag, float>` that live on the `GameplayEffectSpec`. The `Modifier` is just telling the `Aggregator` to look for a `SetByCaller` value associated with the supplied `GameplayTag`. The `SetByCallers` used by `Modifiers` can only use the `GameplayTag` version of the concept. The `FName` version is disabled here. If the `Modifier` is set to `SetByCaller` but a `SetByCaller` with the correct `GameplayTag` does not exist on the `GameplayEffectSpec`, the game will throw a runtime error and return a value of 0. This might cause issues in the case of a `Divide` operation. See [`SetByCallers`](#concepts-ge-spec-setbycaller) for more information on how to use `SetByCallers`.|

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-mods-multiplydivide"></a>
##### 4.5.4.1 Multiply 和
默认情况下，所有 `Multiply` 和 `Divide` `Modifiers` 会先彼此相加，然后再乘到或除到该 `Attribute` 的 `BaseValue` 上。

```c++
float FAggregatorModChannel::EvaluateWithBase(float InlineBaseValue, const FAggregatorEvaluateParameters& Parameters) const
{
	...
	float Additive = SumMods(Mods[EGameplayModOp::Additive], GameplayEffectUtilities::GetModifierBiasByModifierOp(EGameplayModOp::Additive), Parameters);
	float Multiplicitive = SumMods(Mods[EGameplayModOp::Multiplicitive], GameplayEffectUtilities::GetModifierBiasByModifierOp(EGameplayModOp::Multiplicitive), Parameters);
	float Division = SumMods(Mods[EGameplayModOp::Division], GameplayEffectUtilities::GetModifierBiasByModifierOp(EGameplayModOp::Division), Parameters);
	...
	return ((InlineBaseValue + Additive) * Multiplicitive) / Division;
	...
}
```

```c++
float FAggregatorModChannel::SumMods(const TArray<FAggregatorMod>& InMods, float Bias, const FAggregatorEvaluateParameters& Parameters)
{
	float Sum = Bias;

	for (const FAggregatorMod& Mod : InMods)
	{
		if (Mod.Qualifies())
		{
			Sum += (Mod.EvaluatedMagnitude - Bias);
		}
	}

	return Sum;
}
```
*摘自 `GameplayEffectAggregator.cpp`*

在这个公式中，`Multiply` 和 `Divide` `Modifiers` 的 `Bias` 都是 `1`（`Addition` 的 `Bias` 是 `0`）。因此它看起来会像这样：

```
1 + (Mod1.Magnitude - 1) + (Mod2.Magnitude - 1) + ...
```

这个公式会带来一些意料之外的结果。首先，它会先把所有 modifier 相加，再乘到或除到 `BaseValue` 上。大多数人更预期它们应该彼此相乘或相除。例如，如果你有两个值为 `1.5` 的 `Multiply` modifier，大多数人会预期 `BaseValue` 被乘以 `1.5 x 1.5 = 2.25`。但实际上，这里是把两个 `1.5` 相加，从而使 `BaseValue` 被乘以 `2`（`50% increase + another 50% increase = 100% increase`）。在 `GameplayPrediction.h` 的示例中，`500` 基础速度上的 `10%` 速度 buff 会得到 `550`。再加一个 `10%` 速度 buff，则会变成 `600`。

其次，这个公式还包含一些未文档化的规则，限制了可使用的数值范围，因为它是围绕 Paragon 的需求设计的。

`Multiply` 和 `Divide` 的乘法加法公式规则：

公式中的 `Bias` 本质上会把范围 `[1, 2)` 内数字的整数位减掉。第一个 `Modifier` 的 `Bias` 会从初始 `Sum` 值中抵消（循环前 `Sum` 被设为 `Bias`），这就是为什么任意单个值都能正常工作，以及为什么一个 `< 1` 的值可以与 `[1, 2)` 范围内的数字一起工作。

下面是一些 `Multiply` 的示例：

许多游戏会希望它们的 `Multiply` 和 `Divide` `Modifiers` 在应用到 `BaseValue` 之前彼此相乘和相除。要实现这一点，你需要**修改引擎代码**中的 `FAggregatorModChannel::EvaluateWithBase()`。

```c++
float FAggregatorModChannel::EvaluateWithBase(float InlineBaseValue, const FAggregatorEvaluateParameters& Parameters) const
{
	...
	float Multiplicitive = MultiplyMods(Mods[EGameplayModOp::Multiplicitive], Parameters);
	float Division = MultiplyMods(Mods[EGameplayModOp::Division], Parameters);
	...

	return ((InlineBaseValue + Additive) * Multiplicitive) / Division;
}
```

```c++
float FAggregatorModChannel::MultiplyMods(const TArray<FAggregatorMod>& InMods, const FAggregatorEvaluateParameters& Parameters)
{
	float Multiplier = 1.0f;

	for (const FAggregatorMod& Mod : InMods)
	{
		if (Mod.Qualifies())
		{
			Multiplier *= Mod.EvaluatedMagnitude;
		}
	}

	return Multiplier;
}
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-mods-gameplaytags"></a>
##### 4.5.4.2 Modifier 上的

可以为每个 [Modifier](#concepts-ge-mods) 设置 `SourceTags` 和 `TargetTags`。它们的工作方式与 `GameplayEffect` 的 [`Application Tag requirements`](#concepts-ge-tags) 相同。因此，这些 tags 只会在 effect 被应用时考虑。也就是说，对于 periodic、infinite effect，它们只会在 effect 第一次应用时被纳入考虑，而*不会*在每次 periodic 执行时重新考虑。

`Attribute Based` Modifiers 还可以设置 `SourceTagFilter` 和 `TargetTagFilter`。在确定作为 `Attribute Based` Modifier 来源的那个 attribute 的 magnitude 时，这些过滤器会用于排除该 attribute 上的某些 Modifiers。凡是其 source 或 target 不具备过滤器中全部 tags 的 Modifiers，都会被排除。

更详细地说：source ASC 和 target ASC 的 tags 会被 `GameplayEffects` 捕获。source ASC 的 tags 在 `GameplayEffectSpec` 创建时捕获，target ASC 的 tags 在 effect 执行时捕获。当判断某个 infinite 或 duration effect 的 Modifier 是否“符合应用条件”（即其 Aggregator 是否 qualifies）且设置了这些过滤器时，会将捕获到的 tags 与过滤器进行比较。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-stacking"></a>
#### 4.5.5 堆叠
默认情况下，`GameplayEffects` 在应用时会创建新的 `GameplayEffectSpec` 实例，而这些新实例并不会知道也不会关心此前已存在的 `GameplayEffectSpec` 实例。`GameplayEffects` 可以被设置为可堆叠，此时不会添加新的 `GameplayEffectSpec` 实例，而是修改当前已存在的 `GameplayEffectSpec` 的 stack count。堆叠只对 `Duration` 和 `Infinite` `GameplayEffects` 生效。

堆叠有两种类型：Aggregate by Source 和 Aggregate by Target。

|堆叠类型|描述|
| -------------------| ------------------------------------------------------------------------------------------------------------------------------------|
| Aggregate by Source| 在 Target 上，每个 Source `ASC` 都有自己独立的一组堆叠实例。每个 Source 都可以施加 X 层堆叠。|
| Aggregate by Target| 无论 Source 是谁，Target 上都只有一个共享的堆叠实例。每个 Source 都可以往这个共享堆叠中添加层数，直到达到共享上限。|

堆叠还带有关于过期、持续时间刷新以及 period 重置的策略。这些在 `GameplayEffect` Blueprint 中都带有很有帮助的悬停提示。

Sample Project 包含一个自定义 Blueprint 节点，用于监听 `GameplayEffect` 堆叠变化。HUD UMG Widget 使用它来更新玩家拥有的被动护甲层数。这个 `AsyncTask` 会一直存活，直到手动调用 `EndTask()`，而我们是在 UMG Widget 的 `Destruct` 事件中这么做的。参见 `AsyncTaskEffectStackChanged.h/cpp`。

![监听 GameplayEffect 堆叠变化的 BP 节点](https://github.com/tranek/GASDocumentation/raw/master/Images/gestackchange.png)

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-ga"></a>
#### 4.5.6 授予的 Abilities
`GameplayEffects` 可以向 `ASCs` 授予新的 [`GameplayAbilities`](#concepts-ga)。只有 `Duration` 和 `Infinite` `GameplayEffects` 能够授予 abilities。

这种机制的一个常见用例是：当你想强制另一个玩家执行某种行为，例如把他们击退或拉拽移动时。你可以对其应用一个 `GameplayEffect`，该 effect 会授予他们一个自动激活的 ability（关于在 ability 被授予时如何自动激活，见 [Passive Abilities](#concepts-ga-activating-passive)），这个 ability 会对他们执行所需动作。

设计师可以选择 `GameplayEffect` 授予哪些 abilities、以什么 level 授予、绑定到什么[输入](#concepts-ga-input)，以及授予 ability 的移除策略。

|移除策略|描述|
| --------------------------| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Cancel Ability Immediately| 当授予该 ability 的 `GameplayEffect` 从 Target 上移除时，已授予的 ability 会立刻被取消并移除。|
| Remove Ability on End| 已授予的 ability 可以先执行完成，然后再从 Target 上移除。|
| Do Nothing| 已授予的 ability 不受授予它的 `GameplayEffect` 从 Target 上移除的影响。Target 会永久拥有该 ability，直到之后被手动移除。|

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-tags"></a>
`GameplayEffects` 携带多个 [`GameplayTagContainers`](#concepts-gt)。设计师会为每个类别编辑其 `Added` 和 `Removed` `GameplayTagContainers`，编译后结果会显示在 `Combined` `GameplayTagContainer` 中。`Added` tags 是该 `GameplayEffect` 新增而其父类此前没有的 tags。`Removed` tags 是父类拥有但这个子类不再拥有的 tags。

|类别|描述|
| ---------------------------------| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Gameplay Effect Asset Tags|自身拥有的 tags。它们本身不会产生功能，仅用于描述这个 `GameplayEffect`。|
| Granted Tags| 存活在 `GameplayEffect` 上，同时也会授予被应用该 `GameplayEffect` 的 `ASC` 的 tags。当 `GameplayEffect` 被移除时，它们也会从 `ASC` 上被移除。这只对 `Duration` 和 `Infinite` `GameplayEffects` 有效。|
| Ongoing Tag Requirements| 一旦应用，这些 tags 会决定该 `GameplayEffect` 处于开启还是关闭状态。一个 `GameplayEffect` 即使关闭了，也仍然可能处于已应用状态。如果某个 `GameplayEffect` 因不满足 Ongoing Tag Requirements 而被关闭，但之后条件又满足了，那么该 `GameplayEffect` 会重新开启并重新应用其 modifiers。这只对 `Duration` 和 `Infinite` `GameplayEffects` 有效。|
| Application Tag Requirements|身上的 tags，用于决定某个 `GameplayEffect` 是否可以应用到 Target 上。如果这些要求不满足，则不会应用该 `GameplayEffect`。|
| Remove Gameplay Effects with Tags| 当该 `GameplayEffect` 成功应用时，Target 上那些在其 `Asset Tags` 或 `Granted Tags` 中包含任意这些 tags 的 `GameplayEffects` 将会被移除。<br>`GameplayEffects`|

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-immunity"></a>
#### 4.5.8 免疫
`GameplayEffects` 可以授予 immunity，本质上是基于 [`GameplayTags`](#concepts-gt) 阻止其他 `GameplayEffects` 的应用。虽然也可以通过 `Application Tag Requirements` 等其他方式达到类似 immunity 的效果，但使用这个系统的好处是：当 `GameplayEffects` 因 immunity 而被阻止时，会触发一个 delegate：`UAbilitySystemComponent::OnImmunityBlockGameplayEffectDelegate`。

`GrantedApplicationImmunityTags` 会检查 Source `ASC`（包括 Source ability 的 `AbilityTags`，如果存在该 ability）是否拥有任意指定 tags。这是一种基于 tags，为来自特定角色或来源的所有 `GameplayEffects` 提供免疫的方法。

`Granted Application Immunity Query` 会检查传入的 `GameplayEffectSpec` 是否匹配任意 query，从而阻止或允许其应用。

这些 query 在 `GameplayEffect` Blueprint 中都带有很有帮助的悬停提示。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-spec"></a>
[`GameplayEffectSpec`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/FGameplayEffectSpec/index.html)（`GESpec`）可以理解为 `GameplayEffects` 的实例化结果。它们持有自己所代表的 `GameplayEffect` 类的引用、创建时的 level，以及创建者信息。与应该在运行时之前由设计师创建好的 `GameplayEffects` 不同，这些对象可以在运行时自由创建和修改，然后再进行应用。当应用一个 `GameplayEffect` 时，会先根据该 `GameplayEffect` 创建一个 `GameplayEffectSpec`，而实际应用到 Target 上的正是它。

`GameplayEffectSpecs` 通过 `UAbilitySystemComponent::MakeOutgoingSpec()` 从 `GameplayEffects` 创建，该函数可 `BlueprintCallable`。`GameplayEffectSpecs` 不需要立即应用。常见做法是：某个 ability 创建一个 projectile，同时把 `GameplayEffectSpec` 传给这个 projectile，后者在之后命中目标时再应用它。当 `GameplayEffectSpecs` 成功应用后，它们会返回一个名为 `FActiveGameplayEffect` 的新结构体。

值得注意的 `GameplayEffectSpec` 内容：

* 该 `GameplayEffect` 是从哪个 `GameplayEffect` 类创建出来的。<br>The `GameplayEffect` class that this `GameplayEffect` was created from.
* 该 `GameplayEffectSpec` 的 level。通常与创建它的 ability 的 level 相同，但也可以不同。<br>The level of this `GameplayEffectSpec`. Usually the same as the level of the ability that created the `GameplayEffectSpec` but can be different.
* 该 `GameplayEffectSpec` 的持续时间。默认等于 `GameplayEffect` 的持续时间，但也可以不同。<br>The duration of the `GameplayEffectSpec`. Defaults to the duration of the `GameplayEffect` but can be different.
* periodic effect 的 `GameplayEffectSpec` 的 period。默认等于 `GameplayEffect` 的 period，但也可以不同。<br>The period of the `GameplayEffectSpec` for periodic effects. Defaults to the period of the `GameplayEffect` but can be different.
* 该 `GameplayEffectSpec` 当前的 stack count。stack limit 定义在 `GameplayEffect` 上。<br>The current stack count of this `GameplayEffectSpec`. The stack limit is on the `GameplayEffect`.
* [`GameplayEffectContextHandle`](#concepts-ge-context) 用来说明是谁创建了这个 `GameplayEffectSpec`。<br>The [`GameplayEffectContextHandle`](#concepts-ge-context) tells us who created this `GameplayEffectSpec`.
* 由于 snapshotting 而在创建 `GameplayEffectSpec` 时被捕获的 `Attributes`。<br>`Attributes` that were captured at the time of the `GameplayEffectSpec`'s creation due to snapshotting.
* `DynamicGrantedTags`，即除 `GameplayEffect` 本身授予的 `GameplayTags` 之外，`GameplayEffectSpec` 额外授予给 Target 的 tags。<br>`DynamicGrantedTags` that the `GameplayEffectSpec` grants to the Target in addition to the `GameplayTags` that the `GameplayEffect` grants.
* `DynamicAssetTags`，即除 `GameplayEffect` 本身已有的 `AssetTags` 之外，`GameplayEffectSpec` 额外拥有的 tags。<br>`DynamicAssetTags` that the `GameplayEffectSpec` has in addition to the `AssetTags` that the `GameplayEffect` has.

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-spec-setbycaller"></a>
`SetByCallers` 允许 `GameplayEffectSpec` 携带与某个 `GameplayTag` 或 `FName` 关联的 float 值。这些值分别存储在 `GameplayEffectSpec` 上对应的 `TMaps` 中：`TMap<FGameplayTag, float>` 和 `TMap<FName, float>`。它们既可以作为 `GameplayEffect` 上的 `Modifiers` 使用，也可以作为一种通用方式来携带 float 数据。在 ability 内部生成的数值数据，常常会通过 `SetByCallers` 传递给 [`GameplayEffectExecutionCalculations`](#concepts-ge-ec) 或 [`ModifierMagnitudeCalculations`](#concepts-ge-mmc)。

|用途|说明|
| -----------------| -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Modifiers`| 必须预先在 `GameplayEffect` 类中定义。这里只能使用 `GameplayTag` 版本。如果某个值在 `GameplayEffect` 类中被定义了，但 `GameplayEffectSpec` 上没有相应的 tag 与 float 值对，那么在应用 `GameplayEffectSpec` 时游戏会产生运行时错误并返回 0。这对于 `Divide` 操作是潜在问题。参见 [`Modifiers`](#concepts-ge-mods)。|
| Elsewhere| 不需要预先在任何地方定义。读取 `GameplayEffectSpec` 上不存在的 `SetByCaller` 时，可以返回开发者自定义的默认值，并可选择是否发出警告。|

在 Blueprint 中为 `SetByCaller` 赋值时，使用你需要的那个版本的 Blueprint 节点（`GameplayTag` 或 `FName`）：

![为 SetByCaller 赋值](https://github.com/tranek/GASDocumentation/raw/master/Images/setbycaller.png)

在 Blueprint 中读取 `SetByCaller` 值时，你需要在自己的 Blueprint Library 中创建自定义节点。

在 C++ 中为 `SetByCaller` 赋值时，使用你需要的那个函数版本（`GameplayTag` 或 `FName`）：

```c++
void FGameplayEffectSpec::SetSetByCallerMagnitude(FName DataName, float Magnitude);
```
```c++
void FGameplayEffectSpec::SetSetByCallerMagnitude(FGameplayTag DataTag, float Magnitude);
```

在 C++ 中读取 `SetByCaller` 值时，使用你需要的那个函数版本（`GameplayTag` 或 `FName`）：

```c++
float GetSetByCallerMagnitude(FName DataName, bool WarnIfNotFound = true, float DefaultIfNotFound = 0.f) const;
```
```c++
float GetSetByCallerMagnitude(FGameplayTag DataTag, bool WarnIfNotFound = true, float DefaultIfNotFound = 0.f) const;
```

我建议优先使用 `GameplayTag` 版本，而不是 `FName` 版本。这样可以避免在 Blueprint 中出现拼写错误。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-context"></a>
[`GameplayEffectContext`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/FGameplayEffectContext/index.html) 结构体保存了 `GameplayEffectSpec` 的 instigator 以及 [`TargetData`](#concepts-targeting-data) 信息。它也是一个很适合拿来做子类扩展的结构体，可在 [`ModifierMagnitudeCalculations`](#concepts-ge-mmc) / [`GameplayEffectExecutionCalculations`](#concepts-ge-ec)、[`AttributeSets`](#concepts-as) 和 [`GameplayCues`](#concepts-gc) 等位置之间传递任意数据。

要为 `GameplayEffectContext` 创建子类：

1. 继承 `FGameplayEffectContext`。<br>Subclass `FGameplayEffectContext`
2. 重写 `FGameplayEffectContext::GetScriptStruct()`。<br>Override `FGameplayEffectContext::GetScriptStruct()`
3. 重写 `FGameplayEffectContext::Duplicate()`。<br>Override `FGameplayEffectContext::Duplicate()`
4. 如果你的新数据需要被 Replication，则重写 `FGameplayEffectContext::NetSerialize()`。<br>Override `FGameplayEffectContext::NetSerialize()` if your new data needs to be replicated
5. 为你的子类实现 `TStructOpsTypeTraits`，就像父结构体 `FGameplayEffectContext` 那样。<br>Implement `TStructOpsTypeTraits` for your subclass, like the parent struct `FGameplayEffectContext` has
6. 在你的 [`AbilitySystemGlobals`](#concepts-asg) 类中重写 `AllocGameplayEffectContext()`，以返回你的子类新对象。<br>Override `AllocGameplayEffectContext()` in your [`AbilitySystemGlobals`](#concepts-asg) class to return a new object of your subclass

[GASShooter](https://github.com/tranek/GASShooter) 使用了一个子类化的 `GameplayEffectContext` 来附加 `TargetData`，从而可以在 `GameplayCues` 中访问这些数据，特别适用于 shotgun，因为它可能命中多个敌人。


**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-mmc"></a>
[`ModifierMagnitudeCalculations`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/UGameplayModMagnitudeCalculation/index.html)（`ModMagCalc` 或 `MMC`）是用于 `GameplayEffects` 中作为 [`Modifiers`](#concepts-ge-mods) 的强大类。它们的工作方式与 [`GameplayEffectExecutionCalculations`](#concepts-ge-ec) 类似，但功能较弱，而最重要的是它们可以被 [predicted](#concepts-p)。它们唯一的职责是从 `CalculateBaseMagnitude_Implementation()` 返回一个 float 值。你可以在 Blueprint 或 C++ 中继承并重写这个函数。


`MMCs` 可以用于任意持续时间类型的 `GameplayEffects`：`Instant`、`Duration`、`Infinite` 或 `Periodic`。

`MMCs` 的强大之处在于，它们可以捕获 `GameplayEffect` 的 `Source` 或 `Target` 上任意数量的 `Attributes` 值，并且可以完整访问 `GameplayEffectSpec`，从而读取 `GameplayTags` 和 `SetByCallers`。`Attributes` 可以选择 snapshot 或不 snapshot。被 snapshot 的 `Attributes` 会在 `GameplayEffectSpec` 创建时被捕获；未 snapshot 的 `Attributes` 会在 `GameplayEffectSpec` 应用时被捕获，并且对于 `Infinite` 和 `Duration` `GameplayEffects`，当该 `Attribute` 发生变化时会自动更新。捕获 `Attributes` 时，会根据 `ASC` 上已有的 mods 重新计算它们的 `CurrentValue`。这种重新计算**不会**运行 `AbilitySet` 中的 [`PreAttributeChange()`](#concepts-as-preattributechange)，因此任何 clamp 都必须在这里再次处理。

| Snapshot| Source or Target| 在 `GameplayEffectSpec` 上何时捕获| 对于 `Infinite` 或 `Duration` `GE`，`Attribute` 变化时是否自动更新|
| --------| ----------------| --------------------------------| --------------------------------------------------------------------------------|

来自 `MMC` 的结果 float 值，还可以在 `GameplayEffect` 的 `Modifier` 中通过 coefficient 以及 coefficient 前后附加值做进一步修改。

下面是一个 `MMC` 示例：它会捕获 `Target` 的 mana `Attribute`，并在 poison effect 中减少 mana；减少量会根据 `Target` 当前有多少 mana 以及 `Target` 可能拥有的某个 tag 而变化：

```c++
UPAMMC_PoisonMana::UPAMMC_PoisonMana()
{

	//ManaDef defined in header FGameplayEffectAttributeCaptureDefinition ManaDef;
	ManaDef.AttributeToCapture = UPAAttributeSetBase::GetManaAttribute();
	ManaDef.AttributeSource = EGameplayEffectAttributeCaptureSource::Target;
	ManaDef.bSnapshot = false;

	//MaxManaDef defined in header FGameplayEffectAttributeCaptureDefinition MaxManaDef;
	MaxManaDef.AttributeToCapture = UPAAttributeSetBase::GetMaxManaAttribute();
	MaxManaDef.AttributeSource = EGameplayEffectAttributeCaptureSource::Target;
	MaxManaDef.bSnapshot = false;

	RelevantAttributesToCapture.Add(ManaDef);
	RelevantAttributesToCapture.Add(MaxManaDef);
}

float UPAMMC_PoisonMana::CalculateBaseMagnitude_Implementation(const FGameplayEffectSpec & Spec) const
{
	// Gather the tags from the source and target as that can affect which buffs should be used
	const FGameplayTagContainer* SourceTags = Spec.CapturedSourceTags.GetAggregatedTags();
	const FGameplayTagContainer* TargetTags = Spec.CapturedTargetTags.GetAggregatedTags();

	FAggregatorEvaluateParameters EvaluationParameters;
	EvaluationParameters.SourceTags = SourceTags;
	EvaluationParameters.TargetTags = TargetTags;

	float Mana = 0.f;
	GetCapturedAttributeMagnitude(ManaDef, Spec, EvaluationParameters, Mana);
	Mana = FMath::Max<float>(Mana, 0.0f);

	float MaxMana = 0.f;
	GetCapturedAttributeMagnitude(MaxManaDef, Spec, EvaluationParameters, MaxMana);
	MaxMana = FMath::Max<float>(MaxMana, 1.0f); // Avoid divide by zero

	float Reduction = -20.0f;
	if (Mana / MaxMana > 0.5f)
	{
		// Double the effect if the target has more than half their mana
		Reduction *= 2;
	}

	if (TargetTags->HasTagExact(FGameplayTag::RequestGameplayTag(FName("Status.WeakToPoisonMana"))))
	{
		// Double the effect if the target is weak to PoisonMana
		Reduction *= 2;
	}

	return Reduction;
}
```

如果你没有在 `MMC` 构造函数中把 `FGameplayEffectAttributeCaptureDefinition` 加入 `RelevantAttributesToCapture`，却尝试去捕获 `Attributes`，你会得到一个关于在捕获时缺少 Spec 的错误。如果你不需要捕获 `Attributes`，那就不必往 `RelevantAttributesToCapture` 中添加任何内容。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-ec"></a>
[`GameplayEffectExecutionCalculations`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/UGameplayEffectExecutionCalculat-/index.html)（`ExecutionCalculation`、`Execution`，在插件源码中你会经常看到这个术语，或者 `ExecCalc`）是 `GameplayEffects` 对 `ASC` 进行更改的最强大方式。和 [`ModifierMagnitudeCalculations`](#concepts-ge-mmc) 一样，它们可以捕获 `Attributes`，并可选择是否 snapshot。与 `MMCs` 不同的是，它们可以改变不止一个 `Attribute`，并且几乎可以做任何程序员想做的事。其代价是这种能力和灵活性无法被 [predicted](#concepts-p)，并且它们必须用 C++ 实现。


`ExecutionCalculations` 只能与 `Instant` 和 `Periodic` `GameplayEffects` 一起使用。通常，任何名字里带有 `Execute` 的内容，基本都指的是这两类 `GameplayEffects`。

Snapshotting 表示在创建 `GameplayEffectSpec` 时捕获 `Attribute`，而非 snapshotting 则是在应用 `GameplayEffectSpec` 时捕获 `Attribute`。捕获 `Attributes` 时，会根据 `ASC` 上已有的 mods 重新计算它们的 `CurrentValue`。这种重新计算**不会**运行 `AbilitySet` 中的 [`PreAttributeChange()`](#concepts-as-preattributechange)，因此任何 clamp 都必须在这里再次处理。

| Snapshot| Source or Target| 在 `GameplayEffectSpec` 上何时捕获|
| --------| ----------------| --------------------------------|

为了设置 `Attribute` 捕获，我们遵循 Epic 的 ActionRPG Sample Project 建立的模式：定义一个 struct 来持有并定义如何捕获这些 `Attributes`，并在该 struct 的构造函数中创建一份实例。每个 `ExecCalc` 都会有这样一个 struct。**注意：**每个 struct 都需要唯一的名称，因为它们共享同一个命名空间。若这些 struct 使用相同名称，会在捕获 `Attributes` 时导致错误行为（主要是捕获到了错误 `Attributes` 的值）。

对于 `Local Predicted`、`Server Only` 和 `Server Initiated` 的 [`GameplayAbilities`](#concepts-ga)，`ExecCalc` 只会在服务器上调用。

根据复杂公式，读取 `Source` 和 `Target` 上多个 attributes 来计算所受伤害，是 `ExecCalc` 最常见的用例。附带的 Sample Project 中包含一个简单的 `ExecCalc` 用于计算伤害：它从 `GameplayEffectSpec` 的 [`SetByCaller`](#concepts-ge-spec-setbycaller) 中读取伤害值，然后根据从 `Target` 捕获到的 armor `Attribute` 对该值进行减伤。参见 `GDDamageExecCalculation.cpp/.h`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-ec-senddata"></a>
##### 4.5.12.1 向 Execution Calculations 发送数据
除了捕获 `Attributes` 之外，还有几种方式可以向 `ExecutionCalculation` 发送数据。

<a name="concepts-ge-ec-senddata-setbycaller"></a>
任何[设置在 `GameplayEffectSpec` 上的 `SetByCallers`](#concepts-ge-spec-setbycaller) 都可以在 `ExecutionCalculation` 中直接读取。

```c++
const FGameplayEffectSpec& Spec = ExecutionParams.GetOwningSpec();
float Damage = FMath::Max<float>(Spec.GetSetByCallerMagnitude(FGameplayTag::RequestGameplayTag(FName("Data.Damage")), false, -1.0f), 0.0f);
```

<a name="concepts-ge-ec-senddata-backingdataattribute"></a>
如果你想把某些值硬编码到一个 `GameplayEffect` 中，可以通过使用某个已捕获 `Attribute` 作为后备数据的 `CalculationModifier` 来传入这些值。

在这个截图示例中，我们给捕获到的 Damage `Attribute` 增加了 50。你也可以把它设为 `Override`，这样就只会采用这个硬编码值。


`ExecutionCalculation` 会在捕获该 `Attribute` 时读取这个值。

```c++
float Damage = 0.0f;
// Capture optional damage value set on the damage GE as a CalculationModifier under the ExecutionCalculation
ExecutionParams.AttemptCalculateCapturedAttributeMagnitude(DamageStatics().DamageDef, EvaluationParameters, Damage);
```

<a name="concepts-ge-ec-senddata-backingdatatempvariable"></a>
如果你想把某些值硬编码到一个 `GameplayEffect` 中，也可以通过使用 `CalculationModifier`，其后备数据为 `Temporary Variable`（在 C++ 中称为 `Transient Aggregator`）来传入。这种 `Temporary Variable` 与一个 `GameplayTag` 关联。

在这个截图示例中，我们通过 `Data.Damage` `GameplayTag` 向一个 `Temporary Variable` 添加了 50。


把后备 `Temporary Variables` 添加到 `ExecutionCalculation` 的构造函数中：

```c++
ValidTransientAggregatorIdentifiers.AddTag(FGameplayTag::RequestGameplayTag("Data.Damage"));
```

`ExecutionCalculation` 会使用一组与 `Attribute` 捕获函数类似的专用捕获函数来读取该值。

```c++
float Damage = 0.0f;
ExecutionParams.AttemptCalculateTransientAggregatorMagnitude(FGameplayTag::RequestGameplayTag("Data.Damage"), EvaluationParameters, Damage);
```

<a name="concepts-ge-ec-senddata-effectcontext"></a>
你可以通过 `GameplayEffectSpec` 上自定义的 [`GameplayEffectContext`](#concepts-ge-context) 向 `ExecutionCalculation` 发送数据。

在 `ExecutionCalculation` 中，你可以从 `FGameplayEffectCustomExecutionParameters` 访问这个 `EffectContext`。

```c++
const FGameplayEffectSpec& Spec = ExecutionParams.GetOwningSpec();
FGSGameplayEffectContext* ContextHandle = static_cast<FGSGameplayEffectContext*>(Spec.GetContext().Get());
```

如果你需要修改 `GameplayEffectSpec` 或 `EffectContext` 上的某些内容：

```c++
FGameplayEffectSpec* MutableSpec = ExecutionParams.GetOwningSpecForPreExecuteMod();
FGSGameplayEffectContext* ContextHandle = static_cast<FGSGameplayEffectContext*>(MutableSpec->GetContext().Get());
```

如果要在 `ExecutionCalculation` 中修改 `GameplayEffectSpec`，请务必谨慎。参见 `GetOwningSpecForPreExecuteMod()` 的注释。

```c++
/** Non const access. Be careful with this, especially when modifying a spec after attribute capture. */
FGameplayEffectSpec* GetOwningSpecForPreExecuteMod() const;
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-car"></a>
#### 4.5.13 自定义应用要求
[`CustomApplicationRequirement`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/UGameplayEffectCustomApplication-/index.html)（`CAR`）类为设计师提供了比 `GameplayEffect` 上简单 `GameplayTag` 检查更高级的控制手段，用于决定一个 `GameplayEffect` 是否可以被应用。它们既可以在 Blueprint 中通过重写 `CanApplyGameplayEffect()` 来实现，也可以在 C++ 中通过重写 `CanApplyGameplayEffect_Implementation()` 来实现。


适合使用 `CARs` 的示例：

* `Target` 需要拥有某个数量的 `Attribute`。<br>`Target` needs to have a certain amount of an `Attribute`
* `Target` 需要拥有某个 `GameplayEffect` 的一定层数。<br>`Target` needs to have a certain number of stacks of a `GameplayEffect`

`CARs` 还可以做更高级的事情，例如检查这个 `GameplayEffect` 的某个实例是否已经在 `Target` 身上，并且不是应用一个新实例，而是[修改](#concepts-ge-duration)现有实例的持续时间（此时 `CanApplyGameplayEffect()` 返回 false）。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-cost"></a>
#### 4.5.14 消耗型 Gameplay Effect
[`GameplayAbilities`](#concepts-ga) 有一个可选的 `GameplayEffect`，专门设计用作该 ability 的 cost。cost 指的是一个 `ASC` 要激活某个 `GameplayAbility` 所必须拥有的 `Attribute` 数值。如果某个 `GA` 负担不起这个 `Cost GE`，它就无法激活。这个 `Cost GE` 应该是一个 `Instant` `GameplayEffect`，包含一个或多个会从 `Attributes` 中扣减的 `Modifiers`。默认情况下，`Cost GEs` 是为 Prediction 而设计的，建议保持这一能力，也就是不要使用 `ExecutionCalculations`。对于复杂 cost 计算，`MMCs` 完全可用并且值得推荐。

刚开始时，你很可能会为每个有 cost 的 `GA` 使用一个独立的 `Cost GE`。更高级的技巧是：让多个 `GAs` 复用同一个 `Cost GE`，然后只修改从这个 `Cost GE` 创建出来的 `GameplayEffectSpec`，把 `GA` 特有的数据写进去（cost 值定义在 `GA` 上）。**这只对 `Instanced` abilities 有效。**

复用 `Cost GE` 有两种技巧：

1. **使用 `MMC`。**这是最简单的方法。创建一个 [`MMC`](#concepts-ge-mmc)，从 `GameplayEffectSpec` 中拿到 `GameplayAbility` 实例，并读取其中的 cost 值。

```c++
float UPGMMC_HeroAbilityCost::CalculateBaseMagnitude_Implementation(const FGameplayEffectSpec & Spec) const
{
	const UPGGameplayAbility* Ability = Cast<UPGGameplayAbility>(Spec.GetContext().GetAbilityInstance_NotReplicated());

	if (!Ability)
	{
		return 0.0f;
	}

	return Ability->Cost.GetValueAtLevel(Ability->GetAbilityLevel());
}
```

在这个示例中，cost 值是我添加到 `GameplayAbility` 子类上的一个 `FScalableFloat`。

```c++
UPROPERTY(BlueprintReadOnly, EditAnywhere, Category = "Cost")
FScalableFloat Cost;
```

![带有 MMC 的](https://github.com/tranek/GASDocumentation/raw/master/Images/costmmc.png)

2. **重写 `UGameplayAbility::GetCostGameplayEffect()`。**重写这个函数，并在运行时[创建一个 `GameplayEffect`](#concepts-ge-dynamic)，让它去读取 `GameplayAbility` 上的 cost 值。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-cooldown"></a>
#### 4.5.15 冷却型 Gameplay Effect
[`GameplayAbilities`](#concepts-ga) 有一个可选的 `GameplayEffect`，专门设计用作该 ability 的 cooldown。cooldown 决定了 ability 在激活后，多久之后才能再次激活。如果某个 `GA` 仍处于 cooldown 中，它就无法激活。这个 `Cooldown GE` 应该是一个 `Duration` `GameplayEffect`，不带任何 `Modifiers`，并且在 `GameplayEffect` 的 `GrantedTags` 中为每个 `GameplayAbility`（或每个 ability 槽位，如果你的游戏允许在共享 cooldown 的槽位间替换 abilities）设置一个唯一的 `GameplayTag`（即“`Cooldown Tag`”）。`GA` 实际检查的是 `Cooldown Tag` 是否存在，而不是 `Cooldown GE` 是否存在。默认情况下，`Cooldown GEs` 是为 Prediction 而设计的，建议保持这一能力，也就是不要使用 `ExecutionCalculations`。对于复杂 cooldown 计算，`MMCs` 完全可用并且值得推荐。

刚开始时，你很可能会为每个有 cooldown 的 `GA` 使用一个独立的 `Cooldown GE`。更高级的技巧是：让多个 `GAs` 复用同一个 `Cooldown GE`，然后只修改从这个 `Cooldown GE` 创建出来的 `GameplayEffectSpec`，把 `GA` 特有的数据写进去（cooldown 持续时间和 `Cooldown Tag` 定义在 `GA` 上）。**这只对 `Instanced` abilities 有效。**

复用 `Cooldown GE` 有两种技巧：

1. **使用 [`SetByCaller`](#concepts-ge-spec-setbycaller)。**这是最简单的方法。把共享 `Cooldown GE` 的持续时间设为带有某个 `GameplayTag` 的 `SetByCaller`。在你的 `GameplayAbility` 子类上，定义一个用于持续时间的 float / `FScalableFloat`、一个用于唯一 `Cooldown Tag` 的 `FGameplayTagContainer`，以及一个临时的 `FGameplayTagContainer`，它将作为我们返回的指针，表示 `Cooldown Tag` 与 `Cooldown GE` tags 的并集。
```c++
UPROPERTY(BlueprintReadOnly, EditAnywhere, Category = "Cooldown")
FScalableFloat CooldownDuration;

UPROPERTY(BlueprintReadOnly, EditAnywhere, Category = "Cooldown")
FGameplayTagContainer CooldownTags;

// Temp container that we will return the pointer to in GetCooldownTags().
// This will be a union of our CooldownTags and the Cooldown GE's cooldown tags.
UPROPERTY(Transient)
FGameplayTagContainer TempCooldownTags;
```

然后重写 `UGameplayAbility::GetCooldownTags()`，返回我们自己的 `Cooldown Tags` 与任意现有 `Cooldown GE` tags 的并集。

```c++
const FGameplayTagContainer * UPGGameplayAbility::GetCooldownTags() const
{
	FGameplayTagContainer* MutableTags = const_cast<FGameplayTagContainer*>(&TempCooldownTags);
	MutableTags->Reset(); // MutableTags writes to the TempCooldownTags on the CDO so clear it in case the ability cooldown tags change (moved to a different slot)
	const FGameplayTagContainer* ParentTags = Super::GetCooldownTags();
	if (ParentTags)
	{
		MutableTags->AppendTags(*ParentTags);
	}
	MutableTags->AppendTags(CooldownTags);
	return MutableTags;
}
```

最后，重写 `UGameplayAbility::ApplyCooldown()`，把我们的 `Cooldown Tags` 注入到 cooldown `GameplayEffectSpec` 中，并把 `SetByCaller` 添加到该 cooldown `GameplayEffectSpec`。

```c++
void UPGGameplayAbility::ApplyCooldown(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo * ActorInfo, const FGameplayAbilityActivationInfo ActivationInfo) const
{
	UGameplayEffect* CooldownGE = GetCooldownGameplayEffect();
	if (CooldownGE)
	{
		FGameplayEffectSpecHandle SpecHandle = MakeOutgoingGameplayEffectSpec(CooldownGE->GetClass(), GetAbilityLevel());
		SpecHandle.Data.Get()->DynamicGrantedTags.AppendTags(CooldownTags);
		SpecHandle.Data.Get()->SetSetByCallerMagnitude(FGameplayTag::RequestGameplayTag(FName(  OurSetByCallerTag  )), CooldownDuration.GetValueAtLevel(GetAbilityLevel()));
		ApplyGameplayEffectSpecToOwner(Handle, ActorInfo, ActivationInfo, SpecHandle);
	}
}
```

在这张图中，cooldown 持续时间的 `Modifier` 被设置为带有 `Data Tag` `Data.Cooldown` 的 `SetByCaller`。`Data.Cooldown` 就是上面代码中的 `OurSetByCallerTag`。

![带有 SetByCaller 的](https://github.com/tranek/GASDocumentation/raw/master/Images/cooldownsbc.png)

2. **使用 [`MMC`](#concepts-ge-mmc)。**这与上面的设置基本相同，不同之处在于：你不再把 `SetByCaller` 作为 `Cooldown GE` 的持续时间，也不在 `ApplyCooldown` 中设置它。相反，应把持续时间设为 `Custom Calculation Class`，并指向我们即将创建的新 `MMC`。
```c++
UPROPERTY(BlueprintReadOnly, EditAnywhere, Category = "Cooldown")
FScalableFloat CooldownDuration;

UPROPERTY(BlueprintReadOnly, EditAnywhere, Category = "Cooldown")
FGameplayTagContainer CooldownTags;

// Temp container that we will return the pointer to in GetCooldownTags().
// This will be a union of our CooldownTags and the Cooldown GE's cooldown tags.
UPROPERTY(Transient)
FGameplayTagContainer TempCooldownTags;
```

然后重写 `UGameplayAbility::GetCooldownTags()`，返回我们自己的 `Cooldown Tags` 与任意现有 `Cooldown GE` tags 的并集。

```c++
const FGameplayTagContainer * UPGGameplayAbility::GetCooldownTags() const
{
	FGameplayTagContainer* MutableTags = const_cast<FGameplayTagContainer*>(&TempCooldownTags);
	MutableTags->Reset(); // MutableTags writes to the TempCooldownTags on the CDO so clear it in case the ability cooldown tags change (moved to a different slot)
	const FGameplayTagContainer* ParentTags = Super::GetCooldownTags();
	if (ParentTags)
	{
		MutableTags->AppendTags(*ParentTags);
	}
	MutableTags->AppendTags(CooldownTags);
	return MutableTags;
}
```

最后，重写 `UGameplayAbility::ApplyCooldown()`，把我们的 `Cooldown Tags` 注入到 cooldown `GameplayEffectSpec` 中。

```c++
void UPGGameplayAbility::ApplyCooldown(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo * ActorInfo, const FGameplayAbilityActivationInfo ActivationInfo) const
{
	UGameplayEffect* CooldownGE = GetCooldownGameplayEffect();
	if (CooldownGE)
	{
		FGameplayEffectSpecHandle SpecHandle = MakeOutgoingGameplayEffectSpec(CooldownGE->GetClass(), GetAbilityLevel());
		SpecHandle.Data.Get()->DynamicGrantedTags.AppendTags(CooldownTags);
		ApplyGameplayEffectSpecToOwner(Handle, ActorInfo, ActivationInfo, SpecHandle);
	}
}
```

```c++
float UPGMMC_HeroAbilityCooldown::CalculateBaseMagnitude_Implementation(const FGameplayEffectSpec & Spec) const
{
	const UPGGameplayAbility* Ability = Cast<UPGGameplayAbility>(Spec.GetContext().GetAbilityInstance_NotReplicated());

	if (!Ability)
	{
		return 0.0f;
	}

	return Ability->CooldownDuration.GetValueAtLevel(Ability->GetAbilityLevel());
}
```

![带有 MMC 的](https://github.com/tranek/GASDocumentation/raw/master/Images/cooldownmmc.png)

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-cooldown-tr"></a>
##### 4.5.15.1 获取 Cooldown Gameplay Effect 的剩余时间
```c++
bool APGPlayerState::GetCooldownRemainingForTag(FGameplayTagContainer CooldownTags, float & TimeRemaining, float & CooldownDuration)
{
	if (AbilitySystemComponent && CooldownTags.Num() > 0)
	{
		TimeRemaining = 0.f;
		CooldownDuration = 0.f;

		FGameplayEffectQuery const Query = FGameplayEffectQuery::MakeQuery_MatchAnyOwningTags(CooldownTags);
		TArray< TPair<float, float> > DurationAndTimeRemaining = AbilitySystemComponent->GetActiveEffectsTimeRemainingAndDuration(Query);
		if (DurationAndTimeRemaining.Num() > 0)
		{
			int32 BestIdx = 0;
			float LongestTime = DurationAndTimeRemaining[0].Key;
			for (int32 Idx = 1; Idx < DurationAndTimeRemaining.Num(); ++Idx)
			{
				if (DurationAndTimeRemaining[Idx].Key > LongestTime)
				{
					LongestTime = DurationAndTimeRemaining[Idx].Key;
					BestIdx = Idx;
				}
			}

			TimeRemaining = DurationAndTimeRemaining[BestIdx].Key;
			CooldownDuration = DurationAndTimeRemaining[BestIdx].Value;

			return true;
		}
	}

	return false;
}
```

**注意：**在客户端查询 cooldown 的剩余时间，要求客户端能够接收到已 Replication 的 `GameplayEffects`。这取决于它们的 `ASC` 的 [Replication 模式](#concepts-asc-rm)。

<a name="concepts-ge-cooldown-listen"></a>
##### 4.5.15.2 监听 Cooldown 开始和结束
要监听 cooldown 何时开始，你可以通过绑定 `AbilitySystemComponent->OnActiveGameplayEffectAddedDelegateToSelf` 来响应 `Cooldown GE` 被应用，或者通过绑定 `AbilitySystemComponent->RegisterGameplayTagEvent(CooldownTag, EGameplayTagEventType::NewOrRemoved)` 来响应 `Cooldown Tag` 被添加。我更推荐监听 `Cooldown GE` 被添加，因为这样你还能访问应用它时使用的 `GameplayEffectSpec`。借此你可以判断该 `Cooldown GE` 是本地 predicted 的那个，还是服务器修正后的那个。

要监听 cooldown 何时结束，你可以通过绑定 `AbilitySystemComponent->OnAnyGameplayEffectRemovedDelegate()` 来响应 `Cooldown GE` 被移除，或者通过绑定 `AbilitySystemComponent->RegisterGameplayTagEvent(CooldownTag, EGameplayTagEventType::NewOrRemoved)` 来响应 `Cooldown Tag` 被移除。我更推荐监听 `Cooldown Tag` 被移除，因为当服务器修正后的 `Cooldown GE` 到来时，它会移除本地 predicted 的那个，从而触发 `OnAnyGameplayEffectRemovedDelegate()`，即使我们实际上仍然处于 cooldown 中。在移除 predicted `Cooldown GE` 和应用服务器修正后的 `Cooldown GE` 这一过程中，`Cooldown Tag` 不会发生变化。

**注意：**在客户端监听 `GameplayEffect` 的添加或移除，要求客户端能够接收到已 Replication 的 `GameplayEffects`。这取决于它们的 `ASC` 的 [Replication 模式](#concepts-asc-rm)。

Sample Project 包含一个自定义 Blueprint 节点，用于监听 cooldown 的开始和结束。HUD UMG Widget 使用它来更新 Meteor cooldown 的剩余时间。这个 `AsyncTask` 会一直存活，直到手动调用 `EndTask()`，而我们是在 UMG Widget 的 `Destruct` 事件中这么做的。参见 [`AsyncTaskCooldownChanged.h/cpp`](Source/GASDocumentation/Private/Characters/Abilities/AsyncTaskCooldownChanged.cpp)。

![监听 Cooldown 变化的 BP 节点](https://github.com/tranek/GASDocumentation/raw/master/Images/cooldownchange.png)

<a name="concepts-ge-cooldown-prediction"></a>
##### 4.5.15.3 Prediction 冷却
当前 cooldown 实际上还无法真正被 predicted。我们可以在本地 predicted 的 `Cooldown GE` 被应用时启动 UI cooldown timer，但 `GameplayAbility` 的真实 cooldown 是绑定在服务器 cooldown 的剩余时间上的。根据玩家的延迟情况，本地 predicted cooldown 可能已经结束，但服务器上的 `GameplayAbility` 仍然处于 cooldown 中，这会阻止该 `GameplayAbility` 被立即再次激活，直到服务器 cooldown 也结束为止。

Sample Project 的处理方式是：当本地 predicted cooldown 开始时，将 Meteor ability 的 UI 图标变灰；然后等服务器修正后的 `Cooldown GE` 到来后，再启动 cooldown timer。

这会带来一个 gameplay 层面的后果：高延迟玩家在使用短 cooldown abilities 时，其射速会低于低延迟玩家，因此会处于劣势。Fortnite 通过为武器使用不依赖 cooldown `GameplayEffects` 的自定义 bookkeeping 来避免这个问题。

允许真正意义上的 predicted cooldown（即本地 cooldown 结束时玩家就能激活 `GameplayAbility`，即使服务器仍然处于 cooldown）是 Epic 希望未来在 [GAS 的后续迭代](#concepts-p-future) 中实现的内容。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-duration"></a>
#### 4.5.16 修改活动中的 Gameplay Effect 持续时间
要修改某个 `Cooldown GE` 或任意 `Duration` `GameplayEffect` 的剩余时间，我们需要修改其 `GameplayEffectSpec` 的 `Duration`，更新它的 `StartServerWorldTime`、`CachedStartServerWorldTime` 和 `StartWorldTime`，然后通过 `CheckDuration()` 重新执行持续时间检查。在服务器上这样做，并把该 `FActiveGameplayEffect` 标记为 dirty，就会把这些变更 Replication 给客户端。
**注意：**这确实涉及 `const_cast`，可能并不是 Epic 预期的修改持续时间方式，但到目前为止看起来工作得不错。

```c++
bool UPAAbilitySystemComponent::SetGameplayEffectDurationHandle(FActiveGameplayEffectHandle Handle, float NewDuration)
{
	if (!Handle.IsValid())
	{
		return false;
	}

	const FActiveGameplayEffect* ActiveGameplayEffect = GetActiveGameplayEffect(Handle);
	if (!ActiveGameplayEffect)
	{
		return false;
	}

	FActiveGameplayEffect* AGE = const_cast<FActiveGameplayEffect*>(ActiveGameplayEffect);
	if (NewDuration > 0)
	{
		AGE->Spec.Duration = NewDuration;
	}
	else
	{
		AGE->Spec.Duration = 0.01f;
	}

	AGE->StartServerWorldTime = ActiveGameplayEffects.GetServerWorldTime();
	AGE->CachedStartServerWorldTime = AGE->StartServerWorldTime;
	AGE->StartWorldTime = ActiveGameplayEffects.GetWorldTime();
	ActiveGameplayEffects.MarkItemDirty(*AGE);
	ActiveGameplayEffects.CheckDuration(Handle);

	AGE->EventSet.OnTimeChanged.Broadcast(AGE->Handle, AGE->StartWorldTime, AGE->GetDuration());
	OnGameplayEffectDurationChange(*AGE);

	return true;
}
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-dynamic"></a>
#### 4.5.17 在运行时创建动态
在运行时创建动态 `GameplayEffects` 是一个高级主题。你通常不需要经常这么做。

只有 `Instant` `GameplayEffects` 能够在 C++ 中从零开始于运行时创建。`Duration` 和 `Infinite` `GameplayEffects` 不能在运行时动态创建，因为当它们进行 Replication 时，会去查找并不存在的 `GameplayEffect` 类定义。要实现类似功能，你应当像平常一样先在 Editor 中创建一个原型 `GameplayEffect` 类，然后在运行时按需定制它的 `GameplayEffectSpec` 实例。

在[本地](#concepts-p) 的 `GameplayAbility` 中，也可以调用在运行时创建的 `Instant` `GameplayEffects`。不过，目前仍不清楚这种动态创建是否会带来副作用。

##### 示例

Sample Project 会在角色的 `AttributeSet` 中，当角色承受致命一击时，创建一个这样的对象，把 gold 和 experience points 返还给击杀者。

```c++
 // Create a dynamic instant Gameplay Effect to give the bounties
UGameplayEffect* GEBounty = NewObject<UGameplayEffect>(GetTransientPackage(), FName(TEXT("Bounty")));
GEBounty->DurationPolicy = EGameplayEffectDurationType::Instant;

int32 Idx = GEBounty->Modifiers.Num();
GEBounty->Modifiers.SetNum(Idx + 2);

FGameplayModifierInfo& InfoXP = GEBounty->Modifiers[Idx];
InfoXP.ModifierMagnitude = FScalableFloat(GetXPBounty());
InfoXP.ModifierOp = EGameplayModOp::Additive;
InfoXP.Attribute = UGDAttributeSetBase::GetXPAttribute();

FGameplayModifierInfo& InfoGold = GEBounty->Modifiers[Idx + 1];
InfoGold.ModifierMagnitude = FScalableFloat(GetGoldBounty());
InfoGold.ModifierOp = EGameplayModOp::Additive;
InfoGold.Attribute = UGDAttributeSetBase::GetGoldAttribute();

Source->ApplyGameplayEffectToSelf(GEBounty, 1.0f, Source->MakeEffectContext());
```

第二个示例展示了在本地 predicted `GameplayAbility` 内部创建运行时 `GameplayEffect`。请自行承担使用风险（见代码中的注释）！

```c++
UGameplayAbilityRuntimeGE::UGameplayAbilityRuntimeGE()
{
	NetExecutionPolicy = EGameplayAbilityNetExecutionPolicy::LocalPredicted;
}

void UGameplayAbilityRuntimeGE::ActivateAbility(const FGameplayAbilitySpecHandle Handle, const FGameplayAbilityActorInfo* ActorInfo, const FGameplayAbilityActivationInfo ActivationInfo, const FGameplayEventData* TriggerEventData)
{
	if (HasAuthorityOrPredictionKey(ActorInfo, &ActivationInfo))
	{
		if (!CommitAbility(Handle, ActorInfo, ActivationInfo))
		{
			EndAbility(Handle, ActorInfo, ActivationInfo, true, true);
		}

		// Create the GE at runtime.
		UGameplayEffect* GameplayEffect = NewObject<UGameplayEffect>(GetTransientPackage(), TEXT("RuntimeInstantGE"));
		GameplayEffect->DurationPolicy = EGameplayEffectDurationType::Instant; // Only instant works with runtime GE.

		// Add a simple scalable float modifier, which overrides MyAttribute with 42.
		// In real world applications, consume information passed via TriggerEventData.
		const int32 Idx = GameplayEffect->Modifiers.Num();
		GameplayEffect->Modifiers.SetNum(Idx + 1);
		FGameplayModifierInfo& ModifierInfo = GameplayEffect->Modifiers[Idx];
		ModifierInfo.Attribute.SetUProperty(UMyAttributeSet::GetMyModifiedAttribute());
		ModifierInfo.ModifierMagnitude = FScalableFloat(42.f);
		ModifierInfo.ModifierOp = EGameplayModOp::Override;

		// Apply the GE.

		// Create the GESpec here to avoid the behavior of ASC to create GESpecs from the GE class default object.
		// Since we have a dynamic GE here, this would create a GESpec with the base GameplayEffect class, so we
		// would lose our modifiers. Attention: It is unknown, if this "hack" done here can have drawbacks!
		// The spec prevents the GE object being collected by the GarbageCollector, since the GE is a UPROPERTY on the spec.
		FGameplayEffectSpec* GESpec = new FGameplayEffectSpec(GameplayEffect, {}, 0.f); // "new", since lifetime is managed by a shared ptr within the handle
		ApplyGameplayEffectSpecToOwner(Handle, ActorInfo, ActivationInfo, FGameplayEffectSpecHandle(GESpec));
	}
	EndAbility(Handle, ActorInfo, ActivationInfo, false, false);
}
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ge-containers"></a>
#### 4.5.18 Gameplay Effect 容器
Epic 的 [Action RPG Sample Project](https://www.unrealengine.com/marketplace/en-US/product/action-rpg) 实现了一个名为 `FGameplayEffectContainer` 的结构。这些并不属于原生 GAS，但它们对于封装 `GameplayEffects` 和 [`TargetData`](#concepts-targeting-data) 极其方便。它能够自动化一部分工作，例如从 `GameplayEffects` 创建 `GameplayEffectSpecs`，以及在其 `GameplayEffectContext` 中设置默认值。在 `GameplayAbility` 中创建一个 `GameplayEffectContainer` 并把它传给生成出来的 projectile 非常简单直接。我在附带的 Sample Project 中选择不实现 `GameplayEffectContainers`，是为了展示在原生 GAS 中不使用它们时应该如何工作；但我强烈建议你研究一下它们，并考虑将其加入你的项目。

如果你想访问 `GameplayEffectContainers` 里的 `GESpecs`，以执行像添加 `SetByCallers` 这样的操作，可以拆开 `FGameplayEffectContainer`，然后通过 `GESpecs` 数组中的索引访问对应的 `GESpec` 引用。这要求你预先知道你要访问的 `GESpec` 在数组中的索引。

![在 GameplayEffectContainer 中使用](https://github.com/tranek/GASDocumentation/raw/master/Images/gecontainersetbycaller.png)

`GameplayEffectContainers` 还包含一种可选且高效的[选目标](#concepts-targeting-containers)方式。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga"></a>

### 4.6 关于

<a name="concepts-ga-definition"></a>
#### 4.6.1 定义
[`GameplayAbilities`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/Abilities/UGameplayAbility/index.html)（`GA`）是游戏中某个 `Actor` 能执行的任何动作或技能。一个 `GameplayAbility` 可以和其他 `GameplayAbility` 同时处于激活状态，例如冲刺时开枪。它们可以用 Blueprint 或 C++ 实现。


`GameplayAbilities` 的示例：

* 跳跃
* 冲刺
* 开枪
* 每隔 X 秒被动格挡一次攻击
* 使用药水
* 开门
* 收集资源
* 建造建筑

不应使用 `GameplayAbilities` 实现的内容：

* 基础移动输入
* 某些 UI 交互，例如不要用 `GameplayAbility` 来从商店购买物品

这些不是规则，只是我的建议。你的设计和实现可能会不同。

`GameplayAbilities` 自带默认功能，可以拥有等级，用于修改 Attributes 的变化量，或改变 `GameplayAbility` 的功能。

`GameplayAbilities` 会在拥有它的客户端和/或服务器上运行，具体取决于 [`Net Execution Policy`](#concepts-ga-net)，但不会在模拟代理上运行。`Net Execution Policy` 决定某个 `GameplayAbility` 是否会进行本地 [`Prediction`](#concepts-p)。它们还自带对[可选的消耗与冷却 `GameplayEffects`](#concepts-ga-commit) 的默认支持。`GameplayAbilities` 使用 [`AbilityTasks`](#concepts-at) 来处理跨时间发生的动作，例如等待事件、等待 Attribute 变化、等待玩家选择目标，或者使用 `Root Motion Source` 移动 `Character`。**模拟客户端不会运行 `GameplayAbilities`**。相反，当服务器运行能力时，任何需要在模拟代理上表现出来的视觉效果（如动画蒙太奇）都会通过 `AbilityTasks` 进行 Replication 或 RPC，而声音、粒子等纯表现效果则通过 [`GameplayCues`](#concepts-gc) 处理。

所有 `GameplayAbilities` 都会重写其 `ActivateAbility()` 函数以放入你的游戏逻辑。你还可以在 `EndAbility()` 中添加额外逻辑，该函数会在 `GameplayAbility` 完成或被取消时执行。

简单 `GameplayAbility` 的流程图：


更复杂 `GameplayAbility` 的流程图：


复杂能力可以通过多个彼此交互（激活、取消等）的 `GameplayAbilities` 来实现。

<a name="concepts-ga-definition-reppolicy"></a>
##### 4.6.1.1 Replication Policy 说明
不要使用这个选项。这个名字具有误导性，而且你并不需要它。默认情况下，[`GameplayAbilitySpecs`](#concepts-ga-spec) 会从服务器 Replication 到拥有它的客户端。如上所述，**`GameplayAbilities` 不会在模拟代理上运行**。它们通过 `AbilityTasks` 和 `GameplayCues` 将视觉变化 Replication 或 RPC 到模拟代理。Epic 的 Dave Ratti 表示他希望[未来移除这个选项](https://epicgames.ent.box.com/s/m1egifkxv3he3u3xezb9hzbgroxyhx89)。

<a name="concepts-ga-definition-remotecancel"></a>
##### 4.6.1.2 服务器尊重远程能力取消
这个选项往往弊大于利。它的含义是：如果客户端上的 `GameplayAbility` 因取消或自然完成而结束，那么无论服务器上的版本是否真正完成，都会强制服务器版本结束。后者尤其成问题，特别是对于高延迟玩家使用的本地预测 `GameplayAbilities`。通常你会希望关闭这个选项。

<a name="concepts-ga-definition-repinputdirectly"></a>
##### 4.6.1.3 直接 Replication 输入
启用这个选项后，输入按下与松开事件将始终 Replication 到服务器。Epic 建议不要使用它，而是依赖现有输入相关 [`AbilityTasks`](#concepts-at) 内建的 `Generic Replicated Events`，前提是你已经将[输入绑定到你的 `ASC`](#concepts-ga-input)。

Epic 的注释：

```c++
/** Direct Input state replication. These will be called if bReplicateInputDirectly is true on the ability and is generally not a good thing to use. (Instead, prefer to use Generic Replicated Events). */
UAbilitySystemComponent::ServerSetInputPressed()
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-input"></a>
#### 4.6.2 将输入绑定到
`ASC` 允许你将输入动作直接绑定到它，并在授予 `GameplayAbilities` 时把这些输入分配给它们。若 `GameplayTag` 条件满足，分配给 `GameplayAbilities` 的输入动作会在按下时自动激活对应 `GameplayAbilities`。若要使用内建的响应输入的 `AbilityTasks`，必须分配输入动作。

除了用于激活 `GameplayAbilities` 的输入动作外，`ASC` 还接受通用的 `Confirm` 和 `Cancel` 输入。这些特殊输入会被 `AbilityTasks` 用于确认诸如 [`Target Actors`](#concepts-targeting-actors) 之类的操作或取消它们。

要把输入绑定到 `ASC`，你必须先创建一个枚举，把输入动作名称映射成一个字节。枚举名必须与项目设置中该输入动作使用的名称完全一致。`DisplayName` 无关紧要。

来自 Sample Project：

```c++
UENUM(BlueprintType)
enum class EGDAbilityInputID : uint8
{
	// 0 None
	None			UMETA(DisplayName = "None"),
	// 1 Confirm
	Confirm			UMETA(DisplayName = "Confirm"),
	// 2 Cancel
	Cancel			UMETA(DisplayName = "Cancel"),
	// 3 LMB
	Ability1		UMETA(DisplayName = "Ability1"),
	// 4 RMB
	Ability2		UMETA(DisplayName = "Ability2"),
	// 5 Q
	Ability3		UMETA(DisplayName = "Ability3"),
	// 6 E
	Ability4		UMETA(DisplayName = "Ability4"),
	// 7 R
	Ability5		UMETA(DisplayName = "Ability5"),
	// 8 Sprint
	Sprint			UMETA(DisplayName = "Sprint"),
	// 9 Jump
	Jump			UMETA(DisplayName = "Jump")
};
```

如果你的 `ASC` 位于 `Character` 上，那么请在 `SetupPlayerInputComponent()` 中加入绑定到 `ASC` 的函数：

```c++
// Bind to AbilitySystemComponent
FTopLevelAssetPath AbilityEnumAssetPath = FTopLevelAssetPath(FName("/Script/GASDocumentation"), FName("EGDAbilityInputID"));
AbilitySystemComponent->BindAbilityActivationToInputComponent(PlayerInputComponent, FGameplayAbilityInputBinds(FString("ConfirmTarget"),
	FString("CancelTarget"), AbilityEnumAssetPath, static_cast<int32>(EGDAbilityInputID::Confirm), static_cast<int32>(EGDAbilityInputID::Cancel)));
```

如果你的 `ASC` 位于 `PlayerState` 上，那么在 `SetupPlayerInputComponent()` 内部存在潜在竞争条件：此时 `PlayerState` 可能尚未 Replication 到客户端。因此，我建议在 `SetupPlayerInputComponent()` 和 `OnRep_PlayerState()` 中都尝试进行输入绑定。单靠 `OnRep_PlayerState()` 并不够，因为有一种情况是：`PlayerState` 在 `PlayerController` 通知客户端调用 `ClientRestart()`（从而创建 `InputComponent`）之前就先完成了 Replication，此时 `Actor` 的 `InputComponent` 可能还是空。Sample Project 展示了如何在这两个位置都尝试绑定，并用一个布尔值做门控，确保输入实际上只绑定一次。

**注意：** 在 Sample Project 中，枚举里的 `Confirm` 和 `Cancel` 与项目设置中的输入动作名（`ConfirmTarget` 和 `CancelTarget`）并不一致，但我们在 `BindAbilityActivationToInputComponent()` 中提供了它们之间的映射。这两个是特殊情况，因为我们显式提供了映射，所以不必匹配，但也可以匹配。枚举中的所有其他输入必须与项目设置中的输入动作名完全一致。

对于那些只会由一个输入激活的 `GameplayAbilities`（例如在 MOBA 中总是存在于同一个“槽位”），我更喜欢在自己的 `UGameplayAbility` 子类中添加一个变量来定义它们的输入。之后在授予能力时，我可以从 `ClassDefaultObject` 中读取这个值。

<a name="concepts-ga-input-noactivate"></a>
##### 4.6.2.1 绑定输入但不激活能力
如果你不希望在按下输入时自动激活 `GameplayAbilities`，但仍想将它们绑定到输入以配合 `AbilityTasks` 使用，那么你可以在自己的 `UGameplayAbility` 子类中添加一个新的布尔变量 `bActivateOnInput`，默认值为 `true`，然后重写 `UAbilitySystemComponent::AbilityLocalInputPressed()`。

```c++
void UGSAbilitySystemComponent::AbilityLocalInputPressed(int32 InputID)
{
	// Consume the input if this InputID is overloaded with GenericConfirm/Cancel and the GenericConfim/Cancel callback is bound
	if (IsGenericConfirmInputBound(InputID))
	{
		LocalInputConfirm();
		return;
	}

	if (IsGenericCancelInputBound(InputID))
	{
		LocalInputCancel();
		return;
	}

	// ---------------------------------------------------------

	ABILITYLIST_SCOPE_LOCK();
	for (FGameplayAbilitySpec& Spec : ActivatableAbilities.Items)
	{
		if (Spec.InputID == InputID)
		{
			if (Spec.Ability)
			{
				Spec.InputPressed = true;
				if (Spec.IsActive())
				{
					if (Spec.Ability->bReplicateInputDirectly && IsOwnerActorAuthoritative() == false)
					{
						ServerSetInputPressed(Spec.Handle);
					}

					AbilitySpecInputPressed(Spec);

					// Invoke the InputPressed event. This is not replicated here. If someone is listening, they may replicate the InputPressed event to the server.
					InvokeReplicatedEvent(EAbilityGenericReplicatedEvent::InputPressed, Spec.Handle, Spec.ActivationInfo.GetActivationPredictionKey());
				}
				else
				{
					UGSGameplayAbility* GA = Cast<UGSGameplayAbility>(Spec.Ability);
					if (GA && GA->bActivateOnInput)
					{
						// Ability is not active, so try to activate it
						TryActivateAbility(Spec.Handle);
					}
				}
			}
		}
	}
}
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-granting"></a>
#### 4.6.3 授予能力
将某个 `GameplayAbility` 授予给 `ASC` 后，它会被加入 `ASC` 的 `ActivatableAbilities` 列表，使其在满足 [`GameplayTag` 要求](#concepts-ga-tags) 时可以被随时激活。

我们在服务器上授予 `GameplayAbilities`，随后服务器会自动把 [`GameplayAbilitySpec`](#concepts-ga-spec) Replication 给拥有它的客户端。其他客户端 / 模拟代理不会收到 `GameplayAbilitySpec`。

Sample Project 在 `Character` 类上存储了一个 `TArray<TSubclassOf<UGDGameplayAbility>>`，并在游戏开始时读取并授予这些能力：

```c++
void AGDCharacterBase::AddCharacterAbilities()
{
	// Grant abilities, but only on the server
	if (Role != ROLE_Authority || !AbilitySystemComponent.IsValid() || AbilitySystemComponent->bCharacterAbilitiesGiven)
	{
		return;
	}

	for (TSubclassOf<UGDGameplayAbility>& StartupAbility : CharacterAbilities)
	{
		AbilitySystemComponent->GiveAbility(
			FGameplayAbilitySpec(StartupAbility, GetAbilityLevel(StartupAbility.GetDefaultObject()->AbilityID), static_cast<int32>(StartupAbility.GetDefaultObject()->AbilityInputID), this));
	}

	AbilitySystemComponent->bCharacterAbilitiesGiven = true;
}
```

在授予这些 `GameplayAbilities` 时，我们创建了 `GameplayAbilitySpecs`，其中包含 `UGameplayAbility` 类、能力等级、绑定输入，以及 `SourceObject`（也就是是谁把这个 `GameplayAbility` 授予给这个 `ASC` 的）。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-activating"></a>
#### 4.6.4 激活能力
如果某个 `GameplayAbility` 被分配了输入动作，那么当输入被按下并且满足其 `GameplayTag` 条件时，它会自动被激活。但这并不总是理想的激活方式。`ASC` 还提供了另外四种激活 `GameplayAbilities` 的方式：通过 `GameplayTag`、`GameplayAbility` 类、`GameplayAbilitySpec` 句柄，以及通过事件。通过事件激活 `GameplayAbility` 还允许你[随事件传入一份数据载荷](#concepts-ga-data)。

```c++
UFUNCTION(BlueprintCallable, Category = "Abilities")
bool TryActivateAbilitiesByTag(const FGameplayTagContainer& GameplayTagContainer, bool bAllowRemoteActivation = true);

UFUNCTION(BlueprintCallable, Category = "Abilities")
bool TryActivateAbilityByClass(TSubclassOf<UGameplayAbility> InAbilityToActivate, bool bAllowRemoteActivation = true);

bool TryActivateAbility(FGameplayAbilitySpecHandle AbilityToActivate, bool bAllowRemoteActivation = true);

bool TriggerAbilityFromGameplayEvent(FGameplayAbilitySpecHandle AbilityToTrigger, FGameplayAbilityActorInfo* ActorInfo, FGameplayTag Tag, const FGameplayEventData* Payload, UAbilitySystemComponent& Component);

FGameplayAbilitySpecHandle GiveAbilityAndActivateOnce(const FGameplayAbilitySpec& AbilitySpec, const FGameplayEventData* GameplayEventData);
```

要通过事件激活 `GameplayAbility`，该 `GameplayAbility` 必须在自身中配置好 `Triggers`。为它指定一个 `GameplayTag`，并为 `GameplayEvent` 选择一种选项。发送事件时，使用函数 `UAbilitySystemBlueprintLibrary::SendGameplayEventToActor(AActor* Actor, FGameplayTag EventTag, FGameplayEventData Payload)`。通过事件激活 `GameplayAbility` 的好处是你可以传入带数据的 payload。

`GameplayAbility` 的 `Triggers` 还允许你在某个 `GameplayTag` 被添加或移除时激活该 `GameplayAbility`。

**注意：** 在 Blueprint 中通过事件激活 `GameplayAbility` 时，你必须使用 `ActivateAbilityFromEvent` 节点。

**注意：** 除非你的 `GameplayAbility` 会一直运行（例如被动能力），否则别忘了在它应当终止时调用 `EndAbility()`。

**本地预测** `GameplayAbilities` 的激活顺序：

1. **拥有该能力的客户端** 调用 `TryActivateAbility()`
1. 调用 `InternalTryActivateAbility()`
1. 调用 `CanActivateAbility()`，并返回是否满足 `GameplayTag` 要求、`ASC` 是否承担得起消耗、`GameplayAbility` 是否不在冷却中，以及当前是否没有其他实例处于激活状态
1. 调用 `CallServerTryActivateAbility()`，并传入它生成的 `Prediction Key`
1. 调用 `CallActivateAbility()`
1. 调用 `PreActivate()`，Epic 将其称为“样板初始化工作”
1. 调用 `ActivateAbility()`，最终真正激活该能力

**服务器** 接收到 `CallServerTryActivateAbility()`

1. 调用 `ServerTryActivateAbility()`
1. 调用 `InternalServerTryActivateAbility()`
1. 调用 `InternalTryActivateAbility()`
1. 调用 `CanActivateAbility()`，并返回是否满足 `GameplayTag` 要求、`ASC` 是否承担得起消耗、`GameplayAbility` 是否不在冷却中，以及当前是否没有其他实例处于激活状态
1. 如果成功，则调用 `ClientActivateAbilitySucceed()`，通知客户端更新其 `ActivationInfo`，表明本次激活已被服务器确认，并广播 `OnConfirmDelegate` 委托。这与输入确认不是一回事。
1. 调用 `CallActivateAbility()`
1. 调用 `PreActivate()`，Epic 将其称为“样板初始化工作”
1. 调用 `ActivateAbility()`，最终真正激活该能力

如果服务器在任何时刻激活失败，它都会调用 `ClientActivateAbilityFailed()`，立即终止客户端上的 `GameplayAbility`，并撤销所有预测更改。

<a name="concepts-ga-activating-passive"></a>
##### 4.6.4.1 被动能力
要实现会自动激活并持续运行的被动 `GameplayAbilities`，请重写 `UGameplayAbility::OnAvatarSet()`。当某个 `GameplayAbility` 被授予且 `AvatarActor` 被设置时，这个函数会自动调用；此时再调用 `TryActivateAbility()`。

我建议在你的自定义 `UGameplayAbility` 类中添加一个 `bool`，用于指定该 `GameplayAbility` 在被授予时是否应自动激活。Sample Project 就是这样实现其被动护甲叠层能力的。

被动 `GameplayAbilities` 通常会使用 [`Net Execution Policy`](#concepts-ga-net) 中的 `Server Only`。

```c++
void UGDGameplayAbility::OnAvatarSet(const FGameplayAbilityActorInfo * ActorInfo, const FGameplayAbilitySpec & Spec)
{
	Super::OnAvatarSet(ActorInfo, Spec);

	if (bActivateAbilityOnGranted)
	{
		ActorInfo->AbilitySystemComponent->TryActivateAbility(Spec.Handle, false);
	}
}
```

Epic 将这个函数描述为启动被动能力以及处理 `BeginPlay` 类型逻辑的正确位置。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-activating-failedtags"></a>
##### 4.6.4.2 激活失败标签

能力自带默认逻辑，可以告诉你某次能力激活失败的原因。要启用这一点，你必须先配置与默认失败场景对应的 Gameplay Tags。

把这些标签（或使用你自己的命名约定）加入项目中：

```
+GameplayTagList=(Tag="Activation.Fail.BlockedByTags",DevComment="")
+GameplayTagList=(Tag="Activation.Fail.CantAffordCost",DevComment="")
+GameplayTagList=(Tag="Activation.Fail.IsDead",DevComment="")
+GameplayTagList=(Tag="Activation.Fail.MissingTags",DevComment="")
+GameplayTagList=(Tag="Activation.Fail.Networking",DevComment="")
+GameplayTagList=(Tag="Activation.Fail.OnCooldown",DevComment="")
```

然后把它们加入 [`GASDocumentation\Config\DefaultGame.ini`](https://github.com/tranek/GASDocumentation/blob/master/Config/DefaultGame.ini#L8-L13)：

```
[/Script/GameplayAbilities.AbilitySystemGlobals]
ActivateFailIsDeadName=Activation.Fail.IsDead
ActivateFailCooldownName=Activation.Fail.OnCooldown
ActivateFailCostName=Activation.Fail.CantAffordCost
ActivateFailTagsBlockedName=Activation.Fail.BlockedByTags
ActivateFailTagsMissingName=Activation.Fail.MissingTags
ActivateFailNetworkingName=Activation.Fail.Networking
```

现在每当某次能力激活失败时，对应的 GameplayTag 都会出现在输出日志中，或显示在 `showdebug AbilitySystem` HUD 上。

```
LogAbilitySystem: Display: InternalServerTryActivateAbility. Rejecting ClientActivation of Default__GA_FireGun_C. InternalTryActivateAbility failed: Activation.Fail.BlockedByTags
LogAbilitySystem: Display: ClientActivateAbilityFailed_Implementation. PredictionKey :109 Ability: Default__GA_FireGun_C
```

在 `showdebug AbilitySystem` 中显示的 Activation Failed Tags：


**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-cancelabilities"></a>
#### 4.6.5 取消能力
如果要在 `GameplayAbility` 内部取消它自身，可以调用 `CancelAbility()`。这会调用 `EndAbility()`，并将其 `WasCancelled` 参数设为 true。

如果要从外部取消某个 `GameplayAbility`，`ASC` 提供了几个函数：

```c++
/** Cancels the specified ability CDO. */
void CancelAbility(UGameplayAbility* Ability);

/** Cancels the ability indicated by passed in spec handle. If handle is not found among reactivated abilities nothing happens. */
void CancelAbilityHandle(const FGameplayAbilitySpecHandle& AbilityHandle);

/** Cancel all abilities with the specified tags. Will not cancel the Ignore instance */
void CancelAbilities(const FGameplayTagContainer* WithTags=nullptr, const FGameplayTagContainer* WithoutTags=nullptr, UGameplayAbility* Ignore=nullptr);

/** Cancels all abilities regardless of tags. Will not cancel the ignore instance */
void CancelAllAbilities(UGameplayAbility* Ignore=nullptr);

/** Cancels all abilities and kills any remaining instanced abilities */
virtual void DestroyActiveState();
```

**注意：** 我发现如果你存在 `Non-Instanced` `GameplayAbilities`，`CancelAllAbilities` 似乎不能正常工作。它看起来会命中那个 `Non-Instanced` `GameplayAbility` 然后放弃。`CancelAbilities` 对 `Non-Instanced` `GameplayAbilities` 的处理更好，Sample Project 使用的就是它（Jump 就是一个非实例化 `GameplayAbility`）。你的实际结果可能不同。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-definition-activeability"></a>
#### 4.6.6 获取激活中的能力
初学者经常会问：“我怎样才能拿到当前激活的能力？”也许是为了给它设置变量，或者取消它。实际上，同一时间可以有多个 `GameplayAbility` 处于激活状态，所以并不存在唯一的“当前激活能力”。你必须遍历 `ASC` 的 `ActivatableAbilities` 列表（即 `ASC` 拥有的、已授予的 `GameplayAbilities`），找到与你想要的 [`Asset` 或 `Granted` `GameplayTag`](#concepts-ga-tags) 匹配的那个。

`UAbilitySystemComponent::GetActivatableAbilities()` 会返回一个 `TArray<FGameplayAbilitySpec>` 供你迭代。

`ASC` 还提供了另一个辅助函数，它接收一个 `GameplayTagContainer` 参数，以帮助你查找，而不必手动遍历 `GameplayAbilitySpecs` 列表。参数 `bOnlyAbilitiesThatSatisfyTagRequirements` 只会返回满足其 `GameplayTag` 要求、并且当前可以被激活的 `GameplayAbilitySpecs`。例如，你可能有两个基础攻击 `GameplayAbilities`，一个用于持武器，一个用于空手；当是否装备武器改变并设置相应 `GameplayTag` 条件时，就会激活正确的那个。更多信息请参见 Epic 对该函数的注释。

```c++
UAbilitySystemComponent::GetActivatableGameplayAbilitySpecsByAllMatchingTags(const FGameplayTagContainer& GameplayTagContainer, TArray < struct FGameplayAbilitySpec* >& MatchingGameplayAbilities, bool bOnlyAbilitiesThatSatisfyTagRequirements = true)
```

一旦拿到了你要找的 `FGameplayAbilitySpec`，就可以对其调用 `IsActive()`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-instancing"></a>
#### 4.6.7 实例化策略
`GameplayAbility` 的 `Instancing Policy` 决定它在激活时是否以及如何被实例化。

| 实例化策略<br>`Instancing| 描述| 适用示例|
| -----------------------| ------------------------------------------------------------------------------------------------| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 每 Actor 一个实例| 每个 `ASC` 只拥有一个 `GameplayAbility` 实例，并在多次激活之间重复使用。| 这大概会是你最常使用的 `Instancing Policy`。它适用于任何能力，并能在多次激活之间保留状态。设计者需要负责在每次激活之间手动重置那些需要重置的变量。|
| 每次执行一个实例| 每次激活 `GameplayAbility` 时，都会创建一个新的 `GameplayAbility` 实例。| 这类 `GameplayAbilities` 的优点是每次激活时变量都会被重置。它们的性能比 `Instanced Per Actor` 更差，因为每次激活都会生成新的 `GameplayAbilities`。Sample Project 没有使用这种方式。|
| 非实例化|直接运行在它的 `ClassDefaultObject` 上，不会创建实例。| 这是三者中性能最好的，但对可做的事情限制也最大。`Non-Instanced` `GameplayAbilities` 无法存储状态，这意味着不能有动态变量，也不能绑定到 `AbilityTask` 委托。最适合用在频繁使用的简单能力上，比如 MOBA 或 RTS 中小兵的普通攻击。Sample Project 的 Jump `GameplayAbility` 就是 `Non-Instanced`。|

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-net"></a>
#### 4.6.8 网络执行策略
`GameplayAbility` 的 `Net Execution Policy` 决定该 `GameplayAbility` 由谁运行，以及按什么顺序运行。

| 网络执行策略<br>`Net| 描述|
| ----------------------| -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Local Only`|只在拥有它的客户端上运行。这适用于只会产生本地表现效果的能力。单机游戏应使用 `Server Only`。|
| `Local Predicted`|先在拥有它的客户端上激活，然后再在服务器上激活。服务器版本会修正客户端错误预测的任何内容。参见 [Prediction](#concepts-p)。<br>`Local Predicted` `GameplayAbilities` activate first on the owning client and then on the server. The server's version will correct anything that the client predicted incorrectly. See [Prediction](#concepts-p).|
| `Server Only`|只在服务器上运行。被动 `GameplayAbilities` 通常会是 `Server Only`。单机游戏应使用这个。|
| `Server Initiated`|先在服务器上激活，然后再在拥有它的客户端上激活。就我个人而言，我几乎没有用过这种方式。<br>`Server Initiated` `GameplayAbilities` activate first on the server and then on the owning client. I personally haven't used these much if any.|

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-tags"></a>
#### 4.6.9 能力标签
`GameplayAbilities` 自带若干 `GameplayTagContainers` 及其内建逻辑。这些 `GameplayTags` 都不会被 Replication。

|容器<br>`GameplayTag Container`| 描述|
| ---------------------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Ability Tags`|自身拥有的 `GameplayTags`。这些只是用来描述该 `GameplayAbility` 的 `GameplayTags`。<br>`GameplayTags` that the `GameplayAbility` owns. These are just `GameplayTags` to describe the `GameplayAbility`.|
| `Cancel Abilities with Tag`| 当该 `GameplayAbility` 被激活时，其他在其 `Ability Tags` 中包含这些 `GameplayTags` 的 `GameplayAbilities` 将被取消。|
| `Block Abilities with Tag`| 当该 `GameplayAbility` 处于激活状态时，其他在其 `Ability Tags` 中包含这些 `GameplayTags` 的 `GameplayAbilities` 将被阻止激活。|
| `Activation Owned Tags`| 当该 `GameplayAbility` 处于激活状态时，这些 `GameplayTags` 会赋予给该 `GameplayAbility` 的拥有者。记住，这些不会被 Replication。|
| `Activation Required Tags`| 只有当拥有者拥有**全部**这些 `GameplayTags` 时，此 `GameplayAbility` 才能被激活。|
| `Activation Blocked Tags`| 如果拥有者拥有**任意一个**这些 `GameplayTags`，则此 `GameplayAbility` 不能被激活。|
| `Source Required Tags`| 只有当 `Source` 拥有**全部**这些 `GameplayTags` 时，此 `GameplayAbility` 才能被激活。只有当 `GameplayAbility` 由事件触发时，`Source` `GameplayTags` 才会被设置。|
| `Source Blocked Tags`| 如果 `Source` 拥有**任意一个**这些 `GameplayTags`，则此 `GameplayAbility` 不能被激活。只有当 `GameplayAbility` 由事件触发时，`Source` `GameplayTags` 才会被设置。|
| `Target Required Tags`| 只有当 `Target` 拥有**全部**这些 `GameplayTags` 时，此 `GameplayAbility` 才能被激活。只有当 `GameplayAbility` 由事件触发时，`Target` `GameplayTags` 才会被设置。|
| `Target Blocked Tags`| 如果 `Target` 拥有**任意一个**这些 `GameplayTags`，则此 `GameplayAbility` 不能被激活。只有当 `GameplayAbility` 由事件触发时，`Target` `GameplayTags` 才会被设置。|

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-spec"></a>
#### 4.6.10 Gameplay Ability Spec 说明
在某个 `GameplayAbility` 被授予之后，`ASC` 上会存在一个 `GameplayAbilitySpec`，它定义了这个可激活的 `GameplayAbility`，包括 `GameplayAbility` 类、等级、输入绑定，以及必须与 `GameplayAbility` 类本身分离保存的运行时状态。

当一个 `GameplayAbility` 在服务器上被授予时，服务器会把 `GameplayAbilitySpec` Replication 给拥有它的客户端，以便她可以激活它。

激活 `GameplayAbilitySpec` 时，会根据它的 `Instancing Policy` 创建一个 `GameplayAbility` 实例（`Non-Instanced` `GameplayAbilities` 则不会创建实例）。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-data"></a>
#### 4.6.11 向能力传递数据
`GameplayAbilities` 的通用范式是 `Activate->Generate Data->Apply->End`。有时你需要基于已有数据执行逻辑。GAS 为把外部数据传入 `GameplayAbilities` 提供了几种方案：

| 方法| 描述|
| -----------------------------------------------| ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 通过事件激活 `GameplayAbility`| 用带数据 payload 的事件激活 `GameplayAbility`。对于本地预测 `GameplayAbilities`，事件 payload 会从客户端 Replication 到服务器。对于不适合现有字段的任意数据，可以使用两个 `Optional Object` 或 [`TargetData`](#concepts-targeting-data) 变量。缺点是这样会让你无法再通过输入绑定来激活该能力。要通过事件激活 `GameplayAbility`，该 `GameplayAbility` 必须先在自身中配置好 `Triggers`。给它分配一个 `GameplayTag`，并为 `GameplayEvent` 选择一个选项。发送事件时，使用函数 `UAbilitySystemBlueprintLibrary::SendGameplayEventToActor(AActor* Actor, FGameplayTag EventTag, FGameplayEventData Payload)`。|
| 使用 `WaitGameplayEvent` `AbilityTask`| 在 `GameplayAbility` 激活后，使用 `WaitGameplayEvent` `AbilityTask` 让它监听一个带 payload 数据的事件。事件 payload 以及发送方式与通过事件激活 `GameplayAbilities` 完全相同。缺点是 `AbilityTask` 不会 Replication 这些事件，因此它只适用于 `Local Only` 和 `Server Only` `GameplayAbilities`。理论上你也可以自己编写一个能 Replication 事件 payload 的 `AbilityTask`。|
| 使用 `TargetData`| 自定义 `TargetData` 结构体是一个在客户端与服务器之间传递任意数据的好方法。|
| 把数据存到 `OwnerActor` 或 `AvatarActor` 上| 使用存储在 `OwnerActor`、`AvatarActor` 或任何你能拿到引用的对象上的 Replication 变量。这种方式最灵活，也适用于通过输入绑定激活的 `GameplayAbilities`。但它不能保证在使用时这些数据已通过 Replication 同步完成。你必须提前确保这一点。也就是说，如果你刚设置了一个 Replication 变量，然后立刻激活 `GameplayAbility`，由于潜在丢包，接收端并不能保证先收到哪一个。|

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-commit"></a>
#### 4.6.12 能力消耗与冷却
`GameplayAbilities` 自带可选的消耗与冷却功能。消耗是 `ASC` 为了激活某个 `GameplayAbility` 必须拥有的预定义数量的 Attributes，它通过一个 `Instant` `GameplayEffect`（[`Cost GE`](#concepts-ge-cost)）实现。冷却是阻止 `GameplayAbility` 在到期前再次激活的计时器，它通过一个 `Duration` `GameplayEffect`（[`Cooldown GE`](#concepts-ge-cooldown)）实现。

在某个 `GameplayAbility` 调用 `UGameplayAbility::Activate()` 之前，它会先调用 `UGameplayAbility::CanActivateAbility()`。这个函数会检查拥有它的 `ASC` 是否承担得起消耗（`UGameplayAbility::CheckCost()`），并确保该 `GameplayAbility` 当前不在冷却中（`UGameplayAbility::CheckCooldown()`）。

在 `GameplayAbility` 调用 `Activate()` 之后，它可以在任意时刻通过 `UGameplayAbility::CommitAbility()` 选择性地提交消耗和冷却，这会调用 `UGameplayAbility::CommitCost()` 与 `UGameplayAbility::CommitCooldown()`。设计者也可以选择分别调用 `CommitCost()` 或 `CommitCooldown()`，如果它们不应同时提交的话。提交消耗和冷却时会再次调用 `CheckCost()` 和 `CheckCooldown()`，这是该 `GameplayAbility` 因它们而失败的最后机会。因为在 `GameplayAbility` 激活后，拥有它的 `ASC` 的 Attributes 仍有可能发生变化，从而在提交时不再满足消耗条件。如果在提交时 [prediction key](#concepts-p-key) 仍然有效，那么提交消耗和冷却可以进行[本地](#concepts-p)。

实现细节请参见 [`CostGE`](#concepts-ge-cost) 和 [`CooldownGE`](#concepts-ge-cooldown)。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-leveling"></a>
#### 4.6.13 提升能力等级
能力升级通常有两种常见方式：

| 升级方法| 描述|
| ------------------------------------------| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 取消授予并按新等级重新授予| 在服务器上先从 `ASC` 取消授予（移除）该 `GameplayAbility`，然后以更高一级重新授予。如果该 `GameplayAbility` 当时正处于激活状态，这会终止它。|
| 提高 `GameplayAbilitySpec` 的等级| 在服务器上找到对应的 `GameplayAbilitySpec`，提高其等级，并将其标记为 dirty，以便 Replication 给拥有它的客户端。此方法不会终止当时已激活的 `GameplayAbility`。|

这两种方法的主要区别在于：你是否希望激活中的 `GameplayAbilities` 在升级时被取消。你大概率会根据不同的 `GameplayAbilities` 同时使用这两种方法。我建议在你的 `UGameplayAbility` 子类中添加一个 `bool` 来指定使用哪一种方法。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-sets"></a>
#### 4.6.14 能力集合
`GameplayAbilitySets` 是一种便捷的 `UDataAsset` 类，用于保存输入绑定和角色初始 `GameplayAbilities` 列表，并带有授予这些 `GameplayAbilities` 的逻辑。子类还可以包含额外逻辑或属性。Paragon 为每个英雄都准备了一个 `GameplayAbilitySet`，其中包含该英雄拥有的全部 `GameplayAbilities`。

至少基于我目前看到的情况，我觉得这个类并不是必需的。Sample Project 把 `GameplayAbilitySets` 的全部功能都放在了 `GDCharacterBase` 及其子类内部处理。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-batching"></a>
#### 4.6.15 能力批处理
传统的 `Gameplay Ability` 生命周期通常至少涉及客户端向服务器发送两个或三个 RPC。

1. `ServerSetReplicatedTargetData()`（可选）

如果某个 `GameplayAbility` 会在一帧内以一个原子分组完成所有这些动作，我们就可以优化这条流程，把原来的两到三个 RPC 批量合并成一个 RPC。`GAS` 把这种 RPC 优化称为 `Ability Batching`。最常见的使用场景是 hitscan 枪械。hitscan 枪会激活能力、执行一条线性检测、把 [`TargetData`](#concepts-targeting-data) 发送给服务器，然后在同一帧内结束能力。示例项目 [GASShooter](https://github.com/tranek/GASShooter) 为其 hitscan 枪演示了这一技术。

半自动枪是最佳场景，它会把 `CallServerTryActivateAbility()`、`ServerSetReplicatedTargetData()`（子弹命中结果）和 `ServerEndAbility()` 从原本三个 RPC 合并为一个 RPC。

全自动/点射枪会把第一发子弹的 `CallServerTryActivateAbility()` 和 `ServerSetReplicatedTargetData()` 从两个 RPC 合并为一个 RPC。之后每一发子弹仍然各自发送一个 `ServerSetReplicatedTargetData()` RPC。最后，在枪停止射击时，`ServerEndAbility()` 会以单独的 RPC 发送。这是最差场景，因为第一发子弹只节省了一个 RPC，而不是两个。这个场景也可以通过[使用 `Gameplay Event` 激活能力](#concepts-ga-data)来实现，那样会把子弹的 `TargetData` 放进 `EventPayload` 从客户端发送到服务器。后一种方式的缺点是 `TargetData` 必须在能力外部生成，而批处理方式则是在能力内部生成 `TargetData`。

在 [`ASC`](#concepts-asc) 上，`Ability Batching` 默认是关闭的。要启用 `Ability Batching`，请重写 `ShouldDoServerAbilityRPCBatch()` 并返回 true：

```c++
virtual bool ShouldDoServerAbilityRPCBatch() const override { return true; }
```

启用 `Ability Batching` 之后，在激活你希望被批处理的能力之前，必须先创建一个 `FScopedServerAbilityRPCBatcher` 结构体。这个特殊结构体会尝试把其作用域内后续发生的能力相关 RPC 进行批处理。一旦 `FScopedServerAbilityRPCBatcher` 离开作用域，之后激活的能力就不会再尝试批处理。`FScopedServerAbilityRPCBatcher` 的工作方式是：在每个可被批处理的函数中都有特殊代码，它会拦截原本要直接发送 RPC 的调用，转而把消息打包进一个批处理结构体。当 `FScopedServerAbilityRPCBatcher` 离开作用域时，它会在 `UAbilitySystemComponent::EndServerAbilityRPCBatch()` 中自动把这个批处理结构体通过 RPC 发给服务器。服务器会在 `UAbilitySystemComponent::ServerAbilityRPCBatch_Internal(FServerAbilityRPCBatch& BatchInfo)` 中接收该批处理 RPC。`BatchInfo` 参数中会包含一些标记，用来说明能力是否应结束、激活时输入是否被按下，以及是否包含了 `TargetData`。这是一个很适合打断点来确认批处理是否正常工作的函数。或者，也可以使用 cvar `AbilitySystem.ServerRPCBatching.Log 1` 来开启专门的能力批处理日志。

这种机制只能在 C++ 中完成，而且只能通过 `FGameplayAbilitySpecHandle` 来激活能力。

```c++
bool UGSAbilitySystemComponent::BatchRPCTryActivateAbility(FGameplayAbilitySpecHandle InAbilityHandle, bool EndAbilityImmediately)
{
	bool AbilityActivated = false;
	if (InAbilityHandle.IsValid())
	{
		FScopedServerAbilityRPCBatcher GSAbilityRPCBatcher(this, InAbilityHandle);
		AbilityActivated = TryActivateAbility(InAbilityHandle, true);

		if (EndAbilityImmediately)
		{
			FGameplayAbilitySpec* AbilitySpec = FindAbilitySpecFromHandle(InAbilityHandle);
			if (AbilitySpec)
			{
				UGSGameplayAbility* GSAbility = Cast<UGSGameplayAbility>(AbilitySpec->GetPrimaryInstance());
				GSAbility->ExternalEndAbility();
			}
		}

		return AbilityActivated;
	}

	return AbilityActivated;
}
```

GASShooter 对半自动和全自动枪复用了同一个可批处理的 `GameplayAbility`，它们从不直接调用 `EndAbility()`（结束由一个仅本地运行的能力负责，这个本地能力根据当前开火模式管理玩家输入以及对批处理能力的调用）。由于所有 RPC 都必须发生在 `FScopedServerAbilityRPCBatcher` 的作用域内，所以我提供了 `EndAbilityImmediately` 参数，让负责控制/管理的本地能力可以指定：这个能力是否应把 `EndAbility()` 调用一起批处理（半自动），或者不把 `EndAbility()` 一起批处理（全自动），在后者情况下，`EndAbility()` 会在之后某个时刻通过它自己的 RPC 发送。

GASShooter 暴露了一个 Blueprint 节点来支持能力批处理，上面提到的仅本地能力就用它来触发这个被批处理的能力。

激活批处理能力：


**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-ga-netsecuritypolicy"></a>
#### 4.6.16 网络安全策略
`GameplayAbility` 的 `NetSecurityPolicy` 决定一个能力应当在网络中的哪里执行。它可以防止客户端试图执行受限制的能力。

| 网络安全策略<br>`NetSecurityPolicy`| 描述|
| -----------------------| --------------------------------------------------------------------------------------------------------------------------------------------------|
| `ClientOrServer`| 没有安全要求。客户端或服务器都可以自由触发该能力的执行与终止。|
| `ServerOnlyExecution`| 客户端请求执行该能力时，服务器会忽略该请求。客户端仍然可以请求服务器取消或结束这个能力。|
| `ServerOnlyTermination`| 客户端请求取消或结束该能力时，服务器会忽略该请求。客户端仍然可以请求执行该能力。|
| `ServerOnly`| 服务器同时控制该能力的执行与终止。客户端发出的任何请求都会被忽略。|

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-at"></a>
### 4.7 关于

<a name="concepts-at-definition"></a>
### 4.7.1 定义
`GameplayAbilities` 只会在一帧内执行完。这本身不具备太多灵活性。为了执行跨时间发生的动作，或者响应未来某个时间点触发的委托，我们使用一种称为 `AbilityTasks` 的潜伏动作。

GAS 自带很多现成的 `AbilityTasks`：

* 使用 `RootMotionSource` 移动 Characters 的任务
* 播放动画蒙太奇的任务
* 响应 `Attribute` 变化的任务
* 响应 `GameplayEffect` 变化的任务
* 响应玩家输入的任务
* 以及更多

`UAbilityTask` 构造函数强制规定了一个写死的、全游戏范围的上限：同一时间最多只能有 1000 个并发运行的 `AbilityTasks`。当你为同一世界中可能同时存在数百个角色的游戏（例如 RTS）设计 `GameplayAbilities` 时，要牢记这一点。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-at-definition"></a>
### 4.7.2 自定义
很多时候你都会自己编写自定义 `AbilityTasks`（用 C++）。Sample Project 附带了两个自定义 `AbilityTasks`：

1. `PlayMontageAndWaitForEvent` 是默认 `PlayMontageAndWait` 与 `WaitGameplayEvent` `AbilityTasks` 的组合。这让动画蒙太奇可以通过 `AnimNotifies` 把 gameplay events 回传给启动它们的 `GameplayAbility`。用它可以在动画蒙太奇中的特定时刻触发动作。
1. `WaitReceiveDamage` 负责监听 `OwnerActor` 是否受到伤害。被动护甲层数 `GameplayAbility` 会在英雄受到一次伤害时移除一层护甲。

`AbilityTasks` 由以下部分组成：

* 一个用于创建新 `AbilityTask` 实例的静态函数
* 当 `AbilityTask` 完成其目标时会广播的委托
* 一个 `Activate()` 函数，用于开始其主要工作、绑定外部委托等
* 一个 `OnDestroy()` 函数，用于清理，包括解绑它绑定过的外部委托
* 它绑定的所有外部委托所对应的回调函数
* 成员变量，以及任何内部辅助函数

**注意：** `AbilityTasks` 只能声明一种输出委托类型。无论是否使用参数，你的所有输出委托都必须是这种类型。对于未使用的委托参数，请传入默认值。

`AbilityTasks` 只会在运行其所属 `GameplayAbility` 的客户端或服务器上执行；不过，也可以通过在 `AbilityTask` 构造函数中设置 `bSimulatedTask = true;`、重写 `virtual void InitSimulatedTask(UGameplayTasksComponent& InGameplayTasksComponent);`，并让相关成员变量支持 Replication，从而让 `AbilityTasks` 在模拟客户端上运行。这个能力只在少数场景有用，比如移动类 `AbilityTasks`，你不想 Replication 每一次移动变化，而是希望整个移动 `AbilityTask` 都被模拟。所有 `RootMotionSource` `AbilityTasks` 都是这样做的。可参考 `AbilityTask_MoveToLocation.h/.cpp`。

如果你在 `AbilityTask` 构造函数中设置 `bTickingTask = true;` 并重写 `virtual void TickTask(float DeltaTime);`，那么 `AbilityTasks` 就可以 `Tick`。当你需要在多帧之间平滑插值时，这会很有用。可参考 `AbilityTask_MoveToLocation.h/.cpp`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-at-using"></a>
### 4.7.3 使用
在 C++ 中创建并激活一个 `AbilityTask`（摘自 `GDGA_FireGun.cpp`）：

```c++
UGDAT_PlayMontageAndWaitForEvent* Task = UGDAT_PlayMontageAndWaitForEvent::PlayMontageAndWaitForEvent(this, NAME_None, MontageToPlay, FGameplayTagContainer(), 1.0f, NAME_None, false, 1.0f);
Task->OnBlendOut.AddDynamic(this, &UGDGA_FireGun::OnCompleted);
Task->OnCompleted.AddDynamic(this, &UGDGA_FireGun::OnCompleted);
Task->OnInterrupted.AddDynamic(this, &UGDGA_FireGun::OnCancelled);
Task->OnCancelled.AddDynamic(this, &UGDGA_FireGun::OnCancelled);
Task->EventReceived.AddDynamic(this, &UGDGA_FireGun::EventReceived);
Task->ReadyForActivation();
```

在 Blueprint 中，我们只需要使用为该 `AbilityTask` 创建的 Blueprint 节点，不需要手动调用 `ReadyForActivation()`。它会由 `Engine/Source/Editor/GameplayTasksEditor/Private/K2Node_LatentGameplayTaskCall.cpp` 自动调用。如果你的 `AbilityTask` 类中存在 `BeginSpawningActor()` 和 `FinishSpawningActor()`（参见 `AbilityTask_WaitTargetData`），`K2Node_LatentGameplayTaskCall` 也会自动调用它们。再次强调，`K2Node_LatentGameplayTaskCall` 的这类“自动魔法”只对 Blueprint 生效。在 C++ 中，我们必须手动调用 `ReadyForActivation()`、`BeginSpawningActor()` 和 `FinishSpawningActor()`。

Blueprint 中的 WaitTargetData `AbilityTask`：


如果要手动取消一个 `AbilityTask`，只需在 Blueprint（其中它叫 `Async Task Proxy`）或 C++ 中，对该 `AbilityTask` 对象调用 `EndTask()`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-at-rms"></a>
GAS 自带一些 `AbilityTasks`，用于通过挂接到 `CharacterMovementComponent` 的 `Root Motion Sources`，让 `Characters` 随时间移动，以实现击退、复杂跳跃、拉拽、冲刺等效果。

**注意：** `RootMotionSource` `AbilityTasks` 的 Prediction 在 4.19 和 4.25+ 引擎版本中可用。4.20-4.24 版本中 Prediction 存在 bug；不过，这些 `AbilityTasks` 在多人游戏中仍然能工作，只会有轻微的网络校正，在单机中则完全正常。你可以把 4.25 中的这个 [prediction 修复](https://github.com/EpicGames/UnrealEngine/commit/94107438dd9f490e7b743f8e13da46927051bf33#diff-65f6196f9f28f560f95bd578e07e290c) cherry-pick 到自定义的 4.20-4.24 引擎中。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gc"></a>
### 4.8 关于

<a name="concepts-gc-definition"></a>
#### 4.8.1 定义
`GameplayCues`（`GC`）负责执行与 gameplay 无关的内容，例如音效、粒子效果、镜头震动等。`GameplayCues` 通常会进行 Replication（除非你显式在本地 `Executed`、`Added` 或 `Removed`）并支持 Prediction。

我们通过 `ASC` 向 `GameplayCueManager` 发送一个对应的 `GameplayTag` 来触发 `GameplayCues`。这个 `GameplayTag` **必须带有父名称 `GameplayCue.`**，同时还要带上事件类型（`Execute`、`Add` 或 `Remove`）。`GameplayCueNotify` 对象和其他实现了 `IGameplayCueInterface` 的 `Actors`，都可以根据该 `GameplayCue` 的 `GameplayTag`（`GameplayCueTag`）来订阅这些事件。

**注意：** 再强调一次，`GameplayCue` 的 `GameplayTags` 必须以父级 `GameplayTag` `GameplayCue` 开头。例如，一个合法的 `GameplayCue` `GameplayTag` 可以是 `GameplayCue.A.B.C`。

`GameplayCueNotifies` 分为两类：`Static` 和 `Actor`。它们响应的事件不同，也由不同类型的 `GameplayEffects` 触发。请重写对应事件并填入你的逻辑。

|类别<br>`GameplayCue` Class| 事件|类型<br>`GameplayEffect` Type| 描述|
| ------------------------------------------------------------------------------------------------------------------------------------| -----------------| ------------------------| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| [`GameplayCueNotify_Static`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/UGameplayCueNotify_Static/index.html)| `Execute`|或 `Periodic`<br>`Instant` or `Periodic`| 静态 `GameplayCueNotifies` 运行在 `ClassDefaultObject` 上（也就是不会实例化），非常适合一次性效果，例如命中冲击。|
| [`GameplayCueNotify_Actor`](https://docs.unrealengine.com/en-US/BlueprintAPI/GameplayCueNotify/index.html)|或 `Remove`<br>`Add` or `Remove`|或 `Infinite`<br>`Duration` or `Infinite`|会在 `Added` 时生成一个新实例。因为它们是实例化的，所以可以持续执行动作，直到被 `Removed`。它们很适合循环音效和粒子效果，这些效果会在底层的 `Duration` 或 `Infinite` `GameplayEffect` 被移除时，或在手动调用 remove 时被清除。它们还自带一些选项，用于控制同一时间允许多少个实例被 `Added`，从而让同一效果被多次应用时，声音或粒子只启动一次。|

从技术上讲，`GameplayCueNotifies` 可以响应任意事件，但通常我们就是按上表这种方式使用它们。

**注意：** 使用 `GameplayCueNotify_Actor` 时，请检查 `Auto Destroy on Remove`，否则后续针对该 `GameplayCueTag` 的 `Add` 调用将不起作用。

当 `ASC` 使用的 [Replication Mode](#concepts-asc-rm) 不是 `Full` 时，`Add` 和 `Remove` 类型的 `GC` 事件会在服务器玩家（listen server）上触发两次：一次来自应用该 `GE`，另一次来自发给客户端的 “Minimal” `NetMultiCast`。不过，`WhileActive` 事件仍然只会触发一次。所有事件在客户端上都只会触发一次。

Sample Project 包含一个用于 stun 和 sprint 效果的 `GameplayCueNotify_Actor`，也包含一个用于 FireGun 投射物命中的 `GameplayCueNotify_Static`。这些 `GCs` 还可以进一步优化，即[在本地触发它们](#concepts-gc-local)，而不是通过 `GE` 来 Replication。我在 Sample Project 中选择了展示更适合初学者的用法。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gc-trigger"></a>
#### 4.8.2 触发

在 `GameplayEffect` 成功应用时（没有被 tags 或免疫阻挡），在其内部填写所有应被触发的 `GameplayCues` 对应的 `GameplayTags`。

从 `GameplayEffect` 触发的 GameplayCue：


`UGameplayAbility` 提供了 Blueprint 节点来 `Execute`、`Add` 或 `Remove` `GameplayCues`。

从 `GameplayAbility` 触发的 GameplayCue：


在 C++ 中，你可以直接在 `ASC` 上调用这些函数（或者在你的 `ASC` 子类中把它们暴露给 Blueprint）：

```c++
/** GameplayCues can also come on their own. These take an optional effect context to pass through hit result, etc */
void ExecuteGameplayCue(const FGameplayTag GameplayCueTag, FGameplayEffectContextHandle EffectContext = FGameplayEffectContextHandle());
void ExecuteGameplayCue(const FGameplayTag GameplayCueTag, const FGameplayCueParameters& GameplayCueParameters);

/** Add a persistent gameplay cue */
void AddGameplayCue(const FGameplayTag GameplayCueTag, FGameplayEffectContextHandle EffectContext = FGameplayEffectContextHandle());
void AddGameplayCue(const FGameplayTag GameplayCueTag, const FGameplayCueParameters& GameplayCueParameters);

/** Remove a persistent gameplay cue */
void RemoveGameplayCue(const FGameplayTag GameplayCueTag);

/** Removes any GameplayCue added on its own, i.e. not as part of a GameplayEffect. */
void RemoveAllGameplayCues();
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gc-local"></a>
#### 4.8.3 本地
从 `GameplayAbilities` 和 `ASC` 触发 `GameplayCues` 的这些公开函数默认都会进行 Replication。每个 `GameplayCue` 事件都是一个 multicast RPC，这可能导致大量 RPC。GAS 还会强制限制：每次网络更新中，相同 `GameplayCue` 的 RPC 最多只能发送两个。我们可以通过尽可能使用本地 `GameplayCues` 来避免这个问题。本地 `GameplayCues` 只会在单个客户端上 `Execute`、`Add` 或 `Remove`。

适合使用本地 `GameplayCues` 的场景：

* 投射物命中
* 近战碰撞命中
* 由动画蒙太奇触发的 `GameplayCues`

你应该添加到自己 `ASC` 子类中的本地 `GameplayCue` 函数：

```c++
UFUNCTION(BlueprintCallable, Category = "GameplayCue", Meta = (AutoCreateRefTerm = "GameplayCueParameters", GameplayTagFilter = "GameplayCue"))
void ExecuteGameplayCueLocal(const FGameplayTag GameplayCueTag, const FGameplayCueParameters& GameplayCueParameters);

UFUNCTION(BlueprintCallable, Category = "GameplayCue", Meta = (AutoCreateRefTerm = "GameplayCueParameters", GameplayTagFilter = "GameplayCue"))
void AddGameplayCueLocal(const FGameplayTag GameplayCueTag, const FGameplayCueParameters& GameplayCueParameters);

UFUNCTION(BlueprintCallable, Category = "GameplayCue", Meta = (AutoCreateRefTerm = "GameplayCueParameters", GameplayTagFilter = "GameplayCue"))
void RemoveGameplayCueLocal(const FGameplayTag GameplayCueTag, const FGameplayCueParameters& GameplayCueParameters);
```

```c++
void UPAAbilitySystemComponent::ExecuteGameplayCueLocal(const FGameplayTag GameplayCueTag, const FGameplayCueParameters & GameplayCueParameters)
{
	UAbilitySystemGlobals::Get().GetGameplayCueManager()->HandleGameplayCue(GetOwner(), GameplayCueTag, EGameplayCueEvent::Type::Executed, GameplayCueParameters);
}

void UPAAbilitySystemComponent::AddGameplayCueLocal(const FGameplayTag GameplayCueTag, const FGameplayCueParameters & GameplayCueParameters)
{
	UAbilitySystemGlobals::Get().GetGameplayCueManager()->HandleGameplayCue(GetOwner(), GameplayCueTag, EGameplayCueEvent::Type::OnActive, GameplayCueParameters);
	UAbilitySystemGlobals::Get().GetGameplayCueManager()->HandleGameplayCue(GetOwner(), GameplayCueTag, EGameplayCueEvent::Type::WhileActive, GameplayCueParameters);
}

void UPAAbilitySystemComponent::RemoveGameplayCueLocal(const FGameplayTag GameplayCueTag, const FGameplayCueParameters & GameplayCueParameters)
{
	UAbilitySystemGlobals::Get().GetGameplayCueManager()->HandleGameplayCue(GetOwner(), GameplayCueTag, EGameplayCueEvent::Type::Removed, GameplayCueParameters);
}
```

如果某个 `GameplayCue` 是在本地被 `Added` 的，那么它也应当在本地被 `Removed`。如果它是通过 Replication 被 `Added` 的，那么它也应当通过 Replication 被 `Removed`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gc-parameters"></a>
#### 4.8.4 Gameplay Cue 参数
`GameplayCues` 会接收一个 `FGameplayCueParameters` 结构体作为参数，其中包含该 `GameplayCue` 的额外信息。如果你是从 `GameplayAbility` 或 `ASC` 的函数中手动触发 `GameplayCue`，那么你必须手动填写传给 `GameplayCue` 的 `GameplayCueParameters` 结构体。如果 `GameplayCue` 是由 `GameplayEffect` 触发的，那么下列变量会被自动填充到 `GameplayCueParameters` 中：

* Magnitude（如果该 `GameplayEffect` 在 `GameplayCue` 标签容器上方的下拉框中选择了某个 `Attribute` 作为 magnitude，并且存在一个对应影响该 `Attribute` 的 `Modifier`）

在手动触发 `GameplayCue` 时，`GameplayCueParameters` 结构体中的 `SourceObject` 变量可能是一个很适合向 `GameplayCue` 传递任意数据的位置。

**注意：** 参数结构体中的某些变量（例如 `Instigator`）可能已经存在于 `EffectContext` 中。`EffectContext` 也可以包含一个 `FHitResult`，用于指定在世界中哪里生成 `GameplayCue`。继承 `EffectContext` 可能是向 `GameplayCues` 传递更多数据的好方法，尤其适用于那些由 `GameplayEffect` 触发的 `GameplayCues`。

想了解更多，请查看 [`UAbilitySystemGlobals`](#concepts-asg) 中用于填充 `GameplayCueParameters` 结构体的 3 个函数。它们都是 virtual，因此你可以重写它们，让系统自动填入更多信息。

```c++
/** Initialize GameplayCue Parameters */
virtual void InitGameplayCueParameters(FGameplayCueParameters& CueParameters, const FGameplayEffectSpecForRPC &Spec);
virtual void InitGameplayCueParameters_GESpec(FGameplayCueParameters& CueParameters, const FGameplayEffectSpec &Spec);
virtual void InitGameplayCueParameters(FGameplayCueParameters& CueParameters, const FGameplayEffectContextHandle& EffectContext);
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gc-manager"></a>
默认情况下，`GameplayCueManager` 会扫描整个游戏目录，查找 `GameplayCueNotifies`，并在开始运行时把它们加载进内存。我们可以通过在 `DefaultGame.ini` 中配置，改变 `GameplayCueManager` 扫描的路径。

```
[/Script/GameplayAbilities.AbilitySystemGlobals]
GameplayCueNotifyPaths="/Game/GASDocumentation/Characters"
```

我们确实希望 `GameplayCueManager` 扫描并找到所有 `GameplayCueNotifies`；但是，我们并不希望它在开始运行时把每一个都异步加载。这会导致每个 `GameplayCueNotify` 以及它们引用的全部声音和粒子都被加载到内存中，不管它们在当前关卡中是否真的会用到。在像 Paragon 这样的大型游戏中，这可能意味着数百 MB 的无用资源常驻内存，并导致启动卡顿或冻结。

相比在启动时异步加载所有 `GameplayCue`，另一种方案是在它们于游戏中被触发时再按需异步加载。这样可以减少不必要的内存占用，并避免因为启动时异步加载所有 `GameplayCue` 而导致游戏严重卡顿或冻结；代价是某个特定 `GameplayCue` 在首次触发时，效果可能会有延迟。对于 SSD，这种潜在延迟基本不存在。我没有在 HDD 上测试过。如果在 UE Editor 中使用这个方案，当第一次加载某些 GameplayCues 时，如果 Editor 需要编译粒子系统，可能会有轻微卡顿或冻结。而在打包版本中这不是问题，因为粒子系统已经提前编译好了。

首先，我们必须继承 `UGameplayCueManager`，然后在 `DefaultGame.ini` 中告诉 `AbilitySystemGlobals` 类改用我们的 `UGameplayCueManager` 子类。

```
[/Script/GameplayAbilities.AbilitySystemGlobals]
GlobalGameplayCueManagerClass="/Script/ParagonAssets.PBGameplayCueManager"
```

在我们的 `UGameplayCueManager` 子类中，重写 `ShouldAsyncLoadRuntimeObjectLibraries()`。

```c++
virtual bool ShouldAsyncLoadRuntimeObjectLibraries() const override
{
	return false;
}
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gc-prevention"></a>
#### 4.8.6 阻止 Gameplay Cues 触发
有时我们不希望 `GameplayCues` 被触发。例如，如果我们成功格挡了一次攻击，就可能不想播放绑定在伤害 `GameplayEffect` 上的命中冲击效果，或者希望改为播放一个自定义效果。我们可以在 [`GameplayEffectExecutionCalculations`](#concepts-ge-ec) 中通过调用 `OutExecutionOutput.MarkGameplayCuesHandledManually()` 来做到这一点，然后手动向 `Target` 或 `Source` 的 `ASC` 发送我们的 `GameplayCue` 事件。

如果你永远不希望某个特定 `ASC` 上触发任何 `GameplayCues`，可以设置 `AbilitySystemComponent->bSuppressGameplayCues = true;`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gc-batching"></a>
#### 4.8.7 Gameplay Cue 批处理
每个被触发的 `GameplayCue` 都是一个不可靠的 NetMulticast RPC。在我们同时触发多个 `GCs` 的场景下，可以采用一些优化方式，把它们压缩成一个 RPC，或者通过发送更少的数据来节省带宽。

<a name="concepts-gc-batching-manualrpc"></a>
##### 4.8.7.1 手动
假设你有一把霰弹枪，一次发射八个弹丸。这就意味着会有八次射线检测和八个命中 `GameplayCues`。[GASShooter](https://github.com/tranek/GASShooter) 采取了一种偷懒的办法：把所有轨迹信息都塞进 [`EffectContext`](#concepts-ge-ec) 里的 [`TargetData`](#concepts-targeting-data)，从而把它们合并成一个 RPC。虽然这样把 RPC 数量从八个降到了一个，但这个单一 RPC 里仍然会通过网络发送大量数据（约 500 字节）。更优化的做法是发送一个带自定义结构体的 RPC，在其中高效编码命中位置，或者干脆发送一个随机种子数，让接收端据此重建/近似这些命中点。客户端随后再把这个自定义结构体解包，并转换成[本地执行的 `GameplayCues`](#concepts-gc-local)。

其工作方式如下：

1. 声明一个 `FScopedGameplayCueSendContext`。这会抑制 `UGameplayCueManager::FlushPendingCues()` 的执行，直到它离开作用域为止，也就是说，所有 `GameplayCues` 都会先排队，直到 `FScopedGameplayCueSendContext` 离开作用域。
1. 重写 `UGameplayCueManager::FlushPendingCues()`，根据某个自定义 `GameplayTag`，把可以合并批处理的 `GameplayCues` 合并进你的自定义结构体，并通过 RPC 发送给客户端。
1. 客户端接收这个自定义结构体，然后把它解包成在本地执行的 `GameplayCues`。

当你需要为 `GameplayCues` 传递一些 `GameplayCueParameters` 无法很好表达的特定参数，而且又不想把它们加到 `EffectContext` 中时，这种方法也很有用，例如伤害数字、暴击标记、护盾破裂标记、是否致命命中标记等。


<a name="concepts-gc-batching-gcsonge"></a>
##### 4.8.7.2 单个 GE 上的多个
单个 `GameplayEffect` 上的所有 `GameplayCues` 本来就会通过一个 RPC 发送。默认情况下，`UGameplayCueManager::InvokeGameplayCueAddedAndWhileActive_FromSpec()` 会通过不可靠的 NetMulticast 发送整个 `GameplayEffectSpec`（不过会转换成 `FGameplayEffectSpecForRPC`），而不管 `ASC` 的 `Replication Mode` 是什么。这在某些情况下可能会消耗大量带宽，具体取决于 `GameplayEffectSpec` 中包含了什么。我们可以通过设置 cvar `AbilitySystem.AlwaysConvertGESpecToGCParams 1` 来尝试优化。这样会把 `GameplayEffectSpecs` 转换成 `FGameplayCueParameter` 结构体，并通过 RPC 发送这些结构体，而不是整个 `FGameplayEffectSpecForRPC`。这可能节省带宽，但可携带的信息也更少，具体取决于 `GESpec` 如何被转换成 `GameplayCueParameters`，以及你的 `GCs` 需要知道什么。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gc-events"></a>
#### 4.8.8 Gameplay Cue 事件
`GameplayCues` 会响应特定的 `EGameplayCueEvents`：

| `EGameplayCueEvent`| 描述|
| -------------------| -----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `OnActive`| 当某个 `GameplayCue` 被激活（added）时调用。|
| `WhileActive`| 当 `GameplayCue` 处于激活状态时调用，即便它并不是刚刚被应用（例如中途加入游戏等情况）。这不是 `Tick`！它只会像 `OnActive` 一样调用一次，即当某个 `GameplayCueNotify_Actor` 被添加或变得相关时。如果你需要 `Tick()`，那就直接使用 `GameplayCueNotify_Actor` 的 `Tick()`，毕竟它本质上就是一个 `AActor`。|
| `Removed`| 当某个 `GameplayCue` 被移除时调用。响应此事件的 Blueprint `GameplayCue` 函数名为 `OnRemove`。|
| `Executed`| 当某个 `GameplayCue` 被执行时调用：即时效果或周期性 `Tick()`。响应此事件的 Blueprint `GameplayCue` 函数名为 `OnExecute`。|

对那些发生在 `GameplayCue` 开始阶段、且允许后来加入的玩家看不到也没关系的内容，请使用 `OnActive`。对那些 `GameplayCue` 中持续存在、并且你希望后来加入的玩家也能看到的效果，请使用 `WhileActive`。例如，在 MOBA 中，如果你有一个表示防御塔结构爆炸的 `GameplayCue`，那么最初的爆炸粒子和爆炸声音应该放在 `OnActive` 中，而爆炸后残留在地面的持续火焰粒子或声音则应放在 `WhileActive` 中。在这种场景下，让后来加入的玩家重新播放来自 `OnActive` 的初始爆炸并没有意义，但你会希望他们能看到爆炸后仍持续存在的循环火焰效果，也就是 `WhileActive` 中的内容。`OnRemove` 应负责清理 `OnActive` 和 `WhileActive` 中添加的任何东西。每当某个 Actor 进入 `GameplayCueNotify_Actor` 的相关性范围时，`WhileActive` 都会被调用。每当某个 Actor 离开 `GameplayCueNotify_Actor` 的相关性范围时，`OnRemove` 都会被调用。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-gc-reliability"></a>
#### 4.8.9 Gameplay Cue 可靠性

总体来说，`GameplayCues` 应该被视为不可靠，因此不适合承载任何直接影响 gameplay 的内容。

**已执行的 `GameplayCues`：** 这些 `GameplayCues` 是通过不可靠 multicast 应用的，因此始终是不可靠的。

**由 `GameplayEffects` 应用的 `GameplayCues`：**

* Autonomous proxy 会可靠地收到 `OnActive`、`WhileActive` 和 `OnRemove`
`FActiveGameplayEffectsContainer::NetDeltaSerialize()` 会调用 `UAbilitySystemComponent::HandleDeferredGameplayCues()` 来触发 `OnActive` 和 `WhileActive`。`FActiveGameplayEffectsContainer::RemoveActiveGameplayEffectGrantedTagsAndModifiers()` 会调用 `OnRemoved`。

* Simulated proxies 会可靠地收到 `WhileActive` 和 `OnRemove`
`UAbilitySystemComponent::MinimalReplicationGameplayCues` 的 Replication 会触发 `WhileActive` 和 `OnRemove`。`OnActive` 事件则通过一个不可靠 multicast 调用。

**不通过 `GameplayEffect` 应用的 `GameplayCues`：**

* Autonomous proxy 会可靠地收到 `OnRemove`
`OnActive` 和 `WhileActive` 事件通过不可靠 multicast 调用。

* Simulated proxies 会可靠地收到 `WhileActive` 和 `OnRemove`
`UAbilitySystemComponent::MinimalReplicationGameplayCues` 的 Replication 会触发 `WhileActive` 和 `OnRemove`。`OnActive` 事件则通过一个不可靠 multicast 调用。

如果你需要让 `GameplayCue` 中的某些内容“可靠”，那么就通过 `GameplayEffect` 来应用它，并在 `WhileActive` 中添加 FX、在 `OnRemove` 中移除 FX。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-asg"></a>
### 4.9 关于
[`AbilitySystemGlobals`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/UAbilitySystemGlobals/index.html) 类保存了关于 GAS 的全局信息。大多数变量都可以在 `DefaultGame.ini` 中设置。通常你不需要直接和这个类交互，但你应该知道它的存在。如果你需要继承像 [`GameplayCueManager`](#concepts-gc-manager) 或 [`GameplayEffectContext`](#concepts-ge-context) 这样的类，就必须通过 `AbilitySystemGlobals` 来完成。

要继承 `AbilitySystemGlobals`，请在 `DefaultGame.ini` 中设置类名：

```
[/Script/GameplayAbilities.AbilitySystemGlobals]
AbilitySystemGlobalsClassName="/Script/ParagonAssets.PAAbilitySystemGlobals"
```

<a name="concepts-asg-initglobaldata"></a>
在 UE 4.24 到 5.2 之间，如果要使用 [`TargetData`](#concepts-targeting-data)，必须调用 `UAbilitySystemGlobals::Get().InitGlobalData()`，否则你会遇到与 `ScriptStructCache` 相关的错误，并且客户端会从服务器断开。这个函数在一个项目里只需要调用一次。Fortnite 在 `UAssetManager::StartInitialLoading()` 中调用它，Paragon 则在 `UEngine::Init()` 中调用。我认为把它放在 `UAssetManager::StartInitialLoading()` 中是个不错的位置，Sample Project 也是这样做的。我会把这视为一段你应该直接复制进项目的样板代码，以避免 `TargetData` 相关问题。从 5.3 开始，这个函数会自动调用。

如果你在使用 `AbilitySystemGlobals` 的 `GlobalAttributeSetDefaultsTableNames` 时遇到崩溃，你可能需要像 Fortnite 那样，把 `UAbilitySystemGlobals::Get().InitGlobalData()` 放到更晚的时机调用，例如在 `AssetManager` 或 `GameInstance` 中。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-p"></a>
### 4.10 关于
GAS 原生支持客户端侧 Prediction；不过，它并不会预测一切。GAS 中的客户端侧 Prediction 意味着：客户端不需要等待服务器许可，就可以激活 `GameplayAbility` 并应用 `GameplayEffects`。它可以“预测”服务器会允许自己这样做，并预测它会把 `GameplayEffects` 应用到哪些目标上。随后，服务器会在客户端激活能力之后经过一个网络延迟时间，再运行该 `GameplayAbility`，并告知客户端它的预测是否正确。如果客户端有任何预测错误，它就会把那些“误预测”造成的更改“回滚”，以匹配服务器。

关于 GAS Prediction 最权威的资料来源是插件源码中的 `GameplayPrediction.h`。

Epic 的思路是：只预测那些“你能够承担后果”的内容。例如，Paragon 和 Fortnite 都不会预测伤害。它们大概率使用了 [`ExecutionCalculations`](#concepts-ge-ec) 来计算伤害，而那本来就无法被预测。这并不是说你不能尝试预测某些东西，比如伤害。如果你这样做并且效果很好，那当然也完全可以。

> ……我们也并不打算全力投入“预测一切：无缝且自动”的方案。我们仍然认为玩家 Prediction 最好保持在最低限度（也就是：只预测你能接受的最少内容）。
>

*Dave Ratti 对新的 [Network Prediction Plugin](#concepts-p-npp) 的评论*

**可以被预测的内容：**

> * 能力激活
> * 触发事件
> * `GameplayEffect` 应用：
>    * Attribute 修改（**例外：** `Executions` 目前不能预测，只能预测 attribute modifiers）
>    * `GameplayTag` 修改
> * `Gameplay Cue` 事件（无论来自可预测 `GameplayEffect` 内部，还是单独触发）
> * 移动（UE 的 `UCharacterMovement` 已内建支持）

**不能被预测的内容：**

> * `GameplayEffect` 移除
> * `GameplayEffect` 的周期性效果（持续伤害 tick）

*摘自 `GameplayPrediction.h`*

虽然我们可以预测 `GameplayEffect` 的应用，但无法预测 `GameplayEffect` 的移除。绕过这一限制的一种方式是：当我们想移除某个 `GameplayEffect` 时，去预测它的反向效果。比如我们预测性地施加了一个 40% 的移动减速，那么就可以通过施加一个 40% 的移动加速来预测性地“移除”它。然后再同时移除这两个 `GameplayEffects`。这并不适用于所有场景，因此仍然需要官方支持对 `GameplayEffect` 移除进行 Prediction。Epic 的 Dave Ratti 已表示希望在 [GAS 的未来迭代](https://epicgames.ent.box.com/s/m1egifkxv3he3u3xezb9hzbgroxyhx89) 中加入这一点。

由于我们无法预测 `GameplayEffects` 的移除，所以也无法完整预测 `GameplayAbility` 的冷却，而且这里没有可用于反向处理的 `GameplayEffect` 方案。服务器 Replication 过来的 `Cooldown GE` 会存在于客户端上，任何试图绕开这一点的做法（例如使用 `Minimal` replication mode）都会被服务器拒绝。这意味着高延迟客户端需要更久才能通知服务器进入冷却，也要更久才能收到服务器 `Cooldown GE` 被移除的消息。于是，高延迟玩家的射速会低于低延迟玩家，在对抗中处于劣势。Fortnite 通过使用自定义 bookkeeping，而不是 `Cooldown GEs`，来规避这个问题。

关于预测伤害，我个人并不推荐，尽管这通常是很多人刚接触 GAS 时最先尝试的事情之一。我尤其不推荐尝试预测死亡。虽然你可以预测伤害，但这件事很棘手。如果你错误预测了伤害，玩家就会看到敌人的血量又跳回去。如果你还尝试预测死亡，这会尤其别扭和令人沮丧。比如你误判了某个 `Character` 的死亡，它开始布娃娃，然后在服务器纠正后又停止布娃娃并继续朝你开枪。

**注意：** 会修改 Attributes 的 `Instant` `GameplayEffects`（例如 `Cost GEs`）可以在自身身上被无缝预测；但如果去预测其他角色身上的 `Instant` `Attribute` 变化，就会在其 Attributes 上出现短暂异常或“闪动”。被预测的 `Instant` `GameplayEffects` 实际上会被当作 `Infinite` `GameplayEffects` 处理，以便在误预测时能够回滚。当服务器的 `GameplayEffect` 被应用时，目标上可能会短暂同时存在两个相同的 `GameplayEffect`，导致 `Modifier` 在一小段时间内被应用两次或完全没被应用。它最终会自我纠正，但有时这种闪动玩家是能注意到的。

GAS 的 Prediction 实现试图解决的问题：

> 1. “我能这么做吗？” Prediction 的基础协议。
> 2. “撤销” 当 Prediction 失败时，如何撤销副作用。
> 3. “重做” 如何避免那些我们已在本地预测过、但又从服务器 Replication 回来的副作用被重复播放。
> 4. “完整性” 如何确保我们
> 5. “依赖关系” 如何管理依赖性 Prediction 和一连串被预测事件。
> 6. “覆盖” 如何对本来由服务器拥有

*摘自 `GameplayPrediction.h`*

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-p-key"></a>
GAS 的 Prediction 建立在 `Prediction Key` 这一概念上，它是客户端在激活 `GameplayAbility` 时生成的一个整数标识符。

* 客户端在激活 `GameplayAbility` 时生成一个 prediction key。这就是 `Activation Prediction Key`。
* 客户端通过 `CallServerTryActivateAbility()` 把这个 prediction key 发送给服务器。
* 只要这个 prediction key 仍然有效，客户端对其应用的所有 `GameplayEffects` 都会附带这个 prediction key。
* 客户端的 prediction key 作用域结束。在同一个 `GameplayAbility` 中，后续想继续做预测的效果就需要一个新的 [Scoped Prediction Window](#concepts-p-windows)。

* 服务器接收到客户端传来的 prediction key。
* 服务器把这个 prediction key 附加到它应用的所有 `GameplayEffects` 上。
* 服务器再把这个 prediction key Replication 回客户端。

* 客户端收到服务器 Replication 回来的、带有该 prediction key 的 `GameplayEffects`。如果这些 Replication 回来的 `GameplayEffects` 与客户端使用同一个 prediction key 应用过的 `GameplayEffects` 相匹配，那么就说明预测正确。在客户端移除自己预测出来的那一份之前，目标上会临时存在两个 `GameplayEffect` 副本。
* 客户端从服务器收回这个 prediction key。这就是 `Replicated Prediction Key`。此时这个 prediction key 会被标记为 stale。
* 客户端移除**所有**使用这个现已 stale 的 Replication prediction key 创建的 `GameplayEffects`。服务器 Replication 的 `GameplayEffects` 会保留。那些客户端添加了、但没有收到服务器匹配版本的 `GameplayEffects`，就是误预测。

在 `GameplayAbilities` 中，prediction keys 会在一个从激活开始的原子指令分组“窗口”内有效，这个窗口从 activation prediction key 开始。你可以把它理解为只在一帧内有效。任何来自潜伏动作 `AbilityTasks` 的回调都不会再拥有有效的 prediction key，除非这个 `AbilityTask` 带有内建的同步点，会生成新的 [Scoped Prediction Window](#concepts-p-windows)。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-p-windows"></a>
#### 4.10.2 在能力中创建新的
为了在 `AbilityTasks` 的回调中继续预测更多动作，我们需要创建一个新的 Scoped Prediction Window，并配套一个新的 Scoped Prediction Key。这有时也被称为客户端与服务器之间的一个同步点（Synch Point）。某些 `AbilityTasks`，例如所有与输入相关的任务，自带了创建新 scoped prediction window 的能力，这意味着在这些 `AbilityTasks` 的回调中执行的原子代码可以使用一个有效的 scoped prediction key。另一些任务，例如 `WaitDelay`，则没有为其回调创建新的 scoped prediction window 的内建代码。如果你需要在一个没有内建 scoped prediction window 的 `AbilityTask`（如 `WaitDelay`）之后预测行为，就必须手动使用 `WaitNetSync` `AbilityTask` 并选择 `OnlyServerWait`。当客户端执行到带 `OnlyServerWait` 的 `WaitNetSync` 时，它会基于 `GameplayAbility` 的 activation prediction key 生成一个新的 scoped prediction key，通过 RPC 发给服务器，并把它加到之后新应用的所有 `GameplayEffects` 上。当服务器执行到带 `OnlyServerWait` 的 `WaitNetSync` 时，它会等待，直到从客户端接收到这个新的 scoped prediction key 后才继续。这个 scoped prediction key 会像 activation prediction keys 一样走完整个流程：附加到 `GameplayEffects` 上，再 Replication 回客户端，然后被标记为 stale。这个 scoped prediction key 会一直有效，直到它离开作用域，也就是 scoped prediction window 关闭。因此再次强调，只有原子操作、而不是潜伏操作，才能使用这个新的 scoped prediction key。

你可以根据需要创建任意多个 scoped prediction windows。

如果你想把这种同步点功能加到自己的自定义 `AbilityTasks` 中，可以看看输入相关那些任务是如何本质上把 `WaitNetSync` `AbilityTask` 的代码注入进去的。

**注意：** 使用 `WaitNetSync` 时，服务器上的 `GameplayAbility` 确实会被阻塞，直到收到客户端消息后才继续执行。这可能被恶意用户利用，他们通过篡改游戏故意延迟发送新的 scoped prediction key。Epic 虽然会谨慎使用 `WaitNetSync`，但也建议：如果这对你来说是个顾虑，可以考虑构建一个带超时的新版 `AbilityTask`，在客户端迟迟不响应时自动继续执行。

Sample Project 在 Sprint `GameplayAbility` 中使用了 `WaitNetSync`，这样每次应用体力消耗时都会创建一个新的 scoped prediction window，从而让我们可以预测这项消耗。理想情况下，我们希望在应用消耗和冷却时拥有一个有效的 prediction key。

如果你发现某个被预测的 `GameplayEffect` 在拥有该能力的客户端上播放了两次，说明你的 prediction key 已经过期，你正在遇到 “redo” 问题。通常你可以通过在应用该 `GameplayEffect` 之前，插入一个带 `OnlyServerWait` 的 `WaitNetSync` `AbilityTask`，创建一个新的 scoped prediction key 来解决它。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-p-spawn"></a>
#### 4.10.3 预测性生成
在客户端上预测性生成 `Actors` 是一个高级主题。GAS 并没有开箱即用地提供处理它的功能（`SpawnActor` `AbilityTask` 只会在服务器上生成该 `Actor`）。其中的关键概念是：在客户端和服务器上都生成同一个支持 Replication 的 `Actor`。

如果这个 `Actor` 只是表现用途，或者不承担任何 gameplay 功能，那么一个简单方案是重写该 `Actor` 的 `IsNetRelevantFor()` 函数，限制服务器不要把它 Replication 给拥有它的客户端。拥有它的客户端会保留自己本地生成的版本，而服务器和其他客户端则持有服务器 Replication 出去的版本。

```c++
bool APAReplicatedActorExceptOwner::IsNetRelevantFor(const AActor * RealViewer, const AActor * ViewTarget, const FVector & SrcLocation) const
{
	return !IsOwnedBy(ViewTarget);
}
```

如果这个生成出来的 `Actor` 会影响 gameplay，例如一个需要预测伤害的投射物，那么你就需要一套更高级的逻辑，这已经超出了本文档的范围。可以参考 Epic Games GitHub 上 UnrealTournament 对投射物 Prediction 生成的实现。他们会只在拥有它的客户端上生成一个 dummy projectile，并让它与服务器 Replication 的真实投射物同步。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-p-future"></a>
#### 4.10.4 GAS 中 Prediction 的未来
`GameplayPrediction.h` 提到，未来他们可能会加入对 `GameplayEffect` 移除和周期性 `GameplayEffects` 的 Prediction 支持。

Epic 的 Dave Ratti 已[表达过兴趣](https://epicgames.ent.box.com/s/m1egifkxv3he3u3xezb9hzbgroxyhx89)，希望修复预测冷却时的 `latency reconciliation` 问题，也就是高延迟玩家相较低延迟玩家处于劣势的问题。

Epic 新推出的 [`Network Prediction` plugin](#concepts-p-npp) 预计将像之前的 `CharacterMovementComponent` 一样，与 GAS 完全互操作。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-p-npp"></a>
Epic 最近启动了一项计划，准备用新的 `Network Prediction` plugin 取代 `CharacterMovementComponent`。这个插件目前仍处于非常早期的阶段，但已经可以在 Unreal Engine GitHub 上以极早期访问的形式获得。现在还太早，无法判断它会在哪个未来版本的引擎中以实验性 beta 形式首次亮相。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-targeting"></a>
### 4.11 目标选择

<a name="concepts-targeting-data"></a>
#### 4.11.1 目标数据

[`FGameplayAbilityTargetData`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/Abilities/FGameplayAbilityTargetData/index.html) 是一种通用的目标选择数据结构，设计用于在网络间传递。`TargetData` 通常会保存 `AActor`/`UObject` 引用、`FHitResults`，以及其他通用的位置/方向/原点信息。不过，你也可以继承它，把几乎任何你想要的内容放进去，作为一种简单方式来[在 `GameplayAbilities` 的客户端与服务器之间传递数据](#concepts-ga-data)。基础结构体 `FGameplayAbilityTargetData` 并不是给你直接使用的，而是用来被继承的。`GAS` 默认已经提供了几个继承自 `FGameplayAbilityTargetData` 的结构体，位于 `GameplayAbilityTargetTypes.h` 中。


`TargetData` 通常由[`Target Actors`](#concepts-targeting-actors)生成，或者**手动创建**，并通过[`EffectContext`](#concepts-ge-context)被[`AbilityTasks`](#concepts-at)和[`GameplayEffects`](#concepts-ge)消费。因此，由于它位于 `EffectContext` 中，[`Executions`](#concepts-ge-ec)、[`MMCs`](#concepts-ge-mmc)、[`GameplayCues`](#concepts-gc) 以及 [`AttributeSet`](#concepts-as) 后端函数都可以访问 `TargetData`。

我们通常不会直接传递 `FGameplayAbilityTargetData`，而是使用 [`FGameplayAbilityTargetDataHandle`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/Abilities/FGameplayAbilityTargetDataHandle/index.html)，它内部持有一个指向 `FGameplayAbilityTargetData` 的指针 `TArray`。这个中间结构体为 `TargetData` 的多态提供了支持。

继承 `FGameplayAbilityTargetData` 的一个示例：

```c++
USTRUCT(BlueprintType)
struct MYGAME_API FGameplayAbilityTargetData_CustomData : public FGameplayAbilityTargetData
{
    GENERATED_BODY()
public:

    FGameplayAbilityTargetData_CustomData()
    { }

    UPROPERTY()
    FName CoolName = NAME_None;

    UPROPERTY()
    FPredictionKey MyCoolPredictionKey;

    // This is required for all child structs of FGameplayAbilityTargetData
    virtual UScriptStruct* GetScriptStruct() const override
    {
    	return FGameplayAbilityTargetData_CustomData::StaticStruct();
    }

	// This is required for all child structs of FGameplayAbilityTargetData
    bool NetSerialize(FArchive& Ar, class UPackageMap* Map, bool& bOutSuccess)
    {
	    // The engine already defined NetSerialize for FName & FPredictionKey, thanks Epic!
        CoolName.NetSerialize(Ar, Map, bOutSuccess);
        MyCoolPredictionKey.NetSerialize(Ar, Map, bOutSuccess);
        bOutSuccess = true;
        return true;
    }
}

template<>
struct TStructOpsTypeTraits<FGameplayAbilityTargetData_CustomData> : public TStructOpsTypeTraitsBase2<FGameplayAbilityTargetData_CustomData>
{
	enum
	{
        WithNetSerializer = true // This is REQUIRED for FGameplayAbilityTargetDataHandle net serialization to work
	};
};
```

把目标数据加入 handle 的示例：

```c++
UFUNCTION(BlueprintPure)
FGameplayAbilityTargetDataHandle MakeTargetDataFromCustomName(const FName CustomName)
{
	// Create our target data type,
	// Handle's automatically cleanup and delete this data when the handle is destructed,
	// if you don't add this to a handle then be careful because this deals with memory management and memory leaks so its safe to just always add it to a handle at some point in the frame!
	FGameplayAbilityTargetData_CustomData* MyCustomData = new FGameplayAbilityTargetData_CustomData();
	// Setup the struct's information to use the inputted name and any other changes we may want to do
	MyCustomData->CoolName = CustomName;

	// Make our handle wrapper for Blueprint usage
	FGameplayAbilityTargetDataHandle Handle;
	// Add the target data to our handle
	Handle.Add(MyCustomData);
	// Output our handle to Blueprint
	return Handle
}
```

读取值时需要做类型安全检查，因为从 handle 的目标数据中取值的唯一方式，是通过通用的 C/C++ 强制转换，而这**不是**类型安全的，可能导致对象切片和崩溃。做类型检查的方法有很多种（说实话按你喜欢的方式都行），常见的两种是：

- `Gameplay Tag(s)`：你可以使用一套继承层次结构，在已知某种代码架构功能发生时，先转换到基础父类型，读取它的 gameplay tag(s)，再据此判断并转换到具体的子类。

- Script Struct 与 Static Structs：你也可以直接做类比较（这可能会带来很多 `IF` 语句，或者需要写一些模板函数）。下面是一个示例。基本上，你可以从任意 `FGameplayAbilityTargetData` 里取到 script struct（这是它作为 `USTRUCT` 的一个优势，而且所有继承类都必须在 `GetScriptStruct` 中指定自己的 struct 类型），然后与目标类型进行比较。下面展示了如何用这些函数做类型检查：
```c++
UFUNCTION(BlueprintPure)
FName GetCoolNameFromTargetData(const FGameplayAbilityTargetDataHandle& Handle, const int Index)
{
    // NOTE, there is two versions of this '::Get(int32 Index)' function;
    // 1) const version that returns 'const FGameplayAbilityTargetData*', good for reading target data values
    // 2) non-const version that returns 'FGameplayAbilityTargetData*', good for modifying target data values
    FGameplayAbilityTargetData* Data = Handle.Get(Index); // This will valid check the index for you

    // Valid check we have something to use, null data means nothing to cast for
    if(Data == nullptr)
    {
       	return NAME_None;
    }
    // This is basically the type checking pass, static_cast does not have type safety, this is why we do this check.
    // If we don't do this then it will object slice the struct and thus we have no way of making sure its that type.
    if(Data->GetScriptStruct() == FGameplayAbilityTargetData_CustomData::StaticStruct())
    {
        // Here is when you would do the cast because we know its the correct type already
        FGameplayAbilityTargetData_CustomData* CustomData = static_cast<FGameplayAbilityTargetData_CustomData*>(Data);
        return CustomData->CoolName;
    }
    return NAME_None;
}
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-targeting-actors"></a>
#### 4.11.2 目标

`GameplayAbilities` 会通过 `WaitTargetData` 这个 `AbilityTask` 生成 [`TargetActors`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/Abilities/AGameplayAbilityTargetActor/index.html)，以便可视化并从世界中采集目标信息。`TargetActors` 还可以选择性地使用 [`GameplayAbilityWorldReticles`](#concepts-targeting-reticles) 来显示当前目标。确认后，目标信息会以 [`TargetData`](#concepts-targeting-data) 的形式返回，然后可传入 `GameplayEffects`。

`TargetActors` 基于 `AActor`，因此它们可以拥有任意可见组件，用于表现它们**在何处**以及**如何**进行目标选择，例如静态网格或 decal。静态网格可用于可视化角色将要建造的物体摆放位置。decal 可用于显示地面的范围效果。示例项目使用 [`AGameplayAbilityTargetActor_GroundTrace`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/Abilities/AGameplayAbilityTargetActor_Grou-/index.html) 加上地面 decal，来表示 Meteor ability 的伤害范围。它们也可以完全不显示任何东西。例如，对于像 [GASShooter](https://github.com/tranek/GASShooter) 中那样的 hitscan 枪械，目标是瞬时直线检测到的，就没必要显示任何东西。

它们通过基础 trace 或 collision overlap 来采集目标信息，并根据 `TargetActor` 的实现，把结果转换为 `FHitResults` 或 `AActor` 数组形式的 `TargetData`。`WaitTargetData` 这个 `AbilityTask` 通过其 `TEnumAsByte<EGameplayTargetingConfirmation::Type> ConfirmationType` 参数，决定目标何时被确认。当**不**使用 `TEnumAsByte<EGameplayTargetingConfirmation::Type::Instant>` 时，`TargetActor` 通常会在 `Tick()` 中执行 trace/overlap，并根据自身实现把位置更新到 `FHitResult`。虽然这意味着会在 `Tick()` 中进行 trace/overlap，但通常问题不大，因为它本身不做 Replication，而且一般同时只会有一个（当然也可能更多）`TargetActor` 在运行。只要记住它使用了 `Tick()`，一些复杂的 `TargetActors` 可能会在里面做很多事，例如 GASShooter 中火箭发射器的次要能力。虽然在 `Tick()` 里做 trace 对客户端响应性很好，但如果性能开销太大，你可以考虑降低 `TargetActor` 的 tick 频率。而在 `TEnumAsByte<EGameplayTargetingConfirmation::Type::Instant>` 的情况下，`TargetActor` 会立刻生成、产出 `TargetData`，然后销毁，`Tick()` 永远不会被调用。

| `EGameplayTargetingConfirmation::Type`| 何时确认目标|
| --------------------------------------| --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `Instant`| 目标选择会立即发生，不需要特殊逻辑或用户输入来决定何时“发射”。|
| `UserConfirmed`| 当 [ability 绑定到 `Confirm` 输入](#concepts-ga-input) 或调用 `UAbilitySystemComponent::TargetConfirm()` 时，用户确认后才会进行目标选择。`TargetActor` 也会响应绑定的 `Cancel` 输入，或响应调用 `UAbilitySystemComponent::TargetCancel()` 以取消目标选择。|
| `Custom`|负责通过调用 `UGameplayAbility::ConfirmTaskByInstanceName()` 来决定何时目标数据准备就绪。`TargetActor` 也会响应 `UGameplayAbility::CancelTaskByInstanceName()` 来取消目标选择。|
| `CustomMulti`|负责通过调用 `UGameplayAbility::ConfirmTaskByInstanceName()` 来决定何时目标数据准备就绪。`TargetActor` 也会响应 `UGameplayAbility::CancelTaskByInstanceName()` 来取消目标选择。生成数据后不应结束 `AbilityTask`。|

并不是每一种 `EGameplayTargetingConfirmation::Type` 都被每个 `TargetActor` 支持。例如，`AGameplayAbilityTargetActor_GroundTrace` 就不支持 `Instant` 确认方式。

`WaitTargetData` 这个 `AbilityTask` 接受一个 `AGameplayAbilityTargetActor` 类作为参数，并在每次激活 `AbilityTask` 时生成一个实例，在 `AbilityTask` 结束时销毁该 `TargetActor`。`WaitTargetDataUsingActor` 这个 `AbilityTask` 接受一个已经生成好的 `TargetActor`，但在 `AbilityTask` 结束时依然会销毁它。这两个 `AbilityTasks` 的低效之处在于，每次使用都要生成，或者要求为每次使用提供一个新生成的 `TargetActor`。它们很适合原型开发，但在生产环境中，如果你有像自动步枪那样持续不断生成 `TargetData` 的场景，就可能需要考虑优化。GASShooter 提供了一个自定义的 [`AGameplayAbilityTargetActor`](https://github.com/tranek/GASShooter/blob/master/Source/GASShooter/Public/Characters/Abilities/GSGATA_Trace.h) 子类，以及一个全新手写的 [`WaitTargetDataWithReusableActor`](https://github.com/tranek/GASShooter/blob/master/Source/GASShooter/Public/Characters/Abilities/AbilityTasks/GSAT_WaitTargetDataUsingActor.h) `AbilityTask`，允许你复用 `TargetActor` 而不销毁它。

`TargetActors` 默认不做 Replication；不过，如果你的游戏里确实需要让其他玩家看到本地玩家正在瞄准哪里，也可以让它们进行 Replication。它们已经包含了通过 `WaitTargetData` `AbilityTask` 上的 RPC 与服务器通信的默认功能。如果 `TargetActor` 的 `ShouldProduceTargetDataOnServer` 属性被设为 `false`，那么客户端会在确认时，通过 `UAbilityTask_WaitTargetData::OnTargetDataReadyCallback()` 中的 `CallServerSetReplicatedTargetData()`，把自己的 `TargetData` 通过 RPC 发给服务器。如果 `ShouldProduceTargetDataOnServer` 为 `true`，客户端会在 `UAbilityTask_WaitTargetData::OnTargetDataReadyCallback()` 中向服务器发送一个通用确认事件 `EAbilityGenericReplicatedEvent::GenericConfirm` 的 RPC，而服务器在收到 RPC 后再执行 trace 或 overlap 检查，并在服务器端生成数据。如果客户端取消目标选择，它会在 `UAbilityTask_WaitTargetData::OnTargetDataCancelledCallback` 中向服务器发送一个通用取消事件 `EAbilityGenericReplicatedEvent::GenericCancel` 的 RPC。你可以看到，`TargetActor` 和 `WaitTargetData` `AbilityTask` 两边都有大量 delegate。`TargetActor` 会响应输入，生成并广播 `TargetData` 就绪、确认或取消的 delegate。`WaitTargetData` 监听 `TargetActor` 的这些 delegate，并把这些信息转发回 `GameplayAbility` 和服务器。如果你把 `TargetData` 发给服务器，你可能需要在服务器上做校验，确认 `TargetData` 看起来合理，从而防止作弊。直接在服务器上生成 `TargetData` 可以完全避免这个问题，但可能会给拥有该 ability 的客户端带来 Prediction 误差。

根据你使用的 `AGameplayAbilityTargetActor` 具体子类不同，`WaitTargetData` `AbilityTask` 节点上会暴露出不同的 `ExposeOnSpawn` 参数。常见参数包括：

| 常见 `TargetActor` 参数| 定义|
| -------------------------------| ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| Debug| 如果为 `true`，则在非 shipping 构建中，每次 `TargetActor` 执行 trace 时都会绘制调试用的|
| Filter| [可选] 一种特殊结构体，用于在|
| Reticle Class| [可选] `TargetActor` 将要生成的 `AGameplayAbilityWorldReticle` 子类。<br>[Optional]|
| Reticle Parameters| [可选] 配置你的 Reticles。见 [Reticles](#concepts-targeting-reticles)。<br>[Optional] Configure your Reticles. See [Reticles](#concepts-targeting-reticles).|
| Start Location| 一个特殊结构体，用于指定 tracing 应该从哪里开始。通常会是玩家视角、武器枪口，或者 `Pawn` 的位置。|

使用默认 `TargetActor` 类时，只有当 `Actors` 直接处于 trace/overlap 中，它们才算有效目标。如果它们离开了 trace/overlap（它们移动了，或者你把视线移开了），它们就不再是有效目标。如果你希望 `TargetActor` 记住上一个有效目标，你需要在自定义 `TargetActor` 类里自己添加这部分功能。我把这种目标称为 persistent targets，它们会一直保留，直到 `TargetActor` 收到确认或取消、在 trace/overlap 中找到新的有效目标，或者该目标不再有效（被销毁）。GASShooter 在火箭发射器次要能力的 homing rockets 目标选择中就使用了 persistent targets。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-target-data-filters"></a>
#### 4.11.3 目标数据过滤器

通过同时使用 `Make GameplayTargetDataFilter` 和 `Make Filter Handle` 节点，你可以过滤掉玩家的 `Pawn`，或者只选择特定类。如果你需要更高级的过滤逻辑，可以继承 `FGameplayTargetDataFilter` 并重写 `FilterPassesForActor` 函数。

```c++
USTRUCT(BlueprintType)
struct GASDOCUMENTATION_API FGDNameTargetDataFilter : public FGameplayTargetDataFilter
{
	GENERATED_BODY()

	/** Returns true if the actor passes the filter and will be targeted */
	virtual bool FilterPassesForActor(const AActor* ActorToBeFiltered) const override;
};
```

不过，这不能直接接到 `Wait Target Data` 节点上，因为它需要的是 `FGameplayTargetDataFilterHandle`。因此，你必须新写一个自定义的 `Make Filter Handle`，让它接受这个子类：

```c++
FGameplayTargetDataFilterHandle UGDTargetDataFilterBlueprintLibrary::MakeGDNameFilterHandle(FGDNameTargetDataFilter Filter, AActor* FilterActor)
{
	FGameplayTargetDataFilter* NewFilter = new FGDNameTargetDataFilter(Filter);
	NewFilter->InitializeFilterContext(FilterActor);

	FGameplayTargetDataFilterHandle FilterHandle;
	FilterHandle.Filter = TSharedPtr<FGameplayTargetDataFilter>(NewFilter);
	return FilterHandle;
}
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-targeting-reticles"></a>
#### 4.11.4 Gameplay Ability 世界

[`AGameplayAbilityWorldReticles`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/Abilities/AGameplayAbilityWorldReticle/index.html)（`Reticles`）用于在使用非 `Instant` 确认方式的 [`TargetActors`](#concepts-targeting-actors) 进行目标选择时，可视化你正在瞄准**谁**。所有 `Reticles` 的生成与销毁生命周期都由 `TargetActors` 负责。`Reticles` 本身是 `AActors`，因此可以使用任意可视组件来进行表现。一个常见实现方式，如 [GASShooter](https://github.com/tranek/GASShooter) 中所示，是使用 `WidgetComponent` 在屏幕空间显示 UMG Widget（始终朝向玩家摄像机）。`Reticles` 自身并不知道它们附着在哪个 `AActor` 上，但你可以在自定义 `TargetActor` 中加入这项功能。`TargetActors` 通常会在每次 `Tick()` 时，把 `Reticle` 的位置更新到目标的位置。


GASShooter 使用 `Reticles` 来显示火箭发射器次要能力的 homing rockets 已锁定目标。敌人身上的红色指示器就是 `Reticle`。类似的白色图像则是火箭发射器的准星。


`Reticles` 自带一些面向设计师的 `BlueprintImplementableEvents`（它们本来就是打算主要用 Blueprints 开发的）：

```c++
/** Called whenever bIsTargetValid changes value. */
UFUNCTION(BlueprintImplementableEvent, Category = Reticle)
void OnValidTargetChanged(bool bNewValue);

/** Called whenever bIsTargetAnActor changes value. */
UFUNCTION(BlueprintImplementableEvent, Category = Reticle)
void OnTargetingAnActor(bool bNewValue);

UFUNCTION(BlueprintImplementableEvent, Category = Reticle)
void OnParametersInitialized();

UFUNCTION(BlueprintImplementableEvent, Category = Reticle)
void SetReticleMaterialParamFloat(FName ParamName, float value);

UFUNCTION(BlueprintImplementableEvent, Category = Reticle)
void SetReticleMaterialParamVector(FName ParamName, FVector value);
```

`Reticles` 可以选择性地使用由 `TargetActor` 提供的 [`FWorldReticleParameters`](https://docs.unrealengine.com/en-US/API/Plugins/GameplayAbilities/Abilities/FWorldReticleParameters/index.html) 来进行配置。默认结构体只提供一个变量 `FVector AOEScale`。从技术上讲你可以继承这个结构体，但 `TargetActor` 只接受基础结构体。默认 `TargetActors` 不允许它被继承，这一点看起来有些考虑不周。不过，如果你自己写自定义 `TargetActor`，就可以提供你自己的自定义 reticle parameters 结构体，并在生成它们时手动传给你自己的 `AGameplayAbilityWorldReticles` 子类。

`Reticles` 默认不做 Replication，但如果你的游戏确实需要让其他玩家看到本地玩家正在瞄准谁，也可以让它们进行 Replication。

在默认 `TargetActors` 下，`Reticles` 只会显示在当前有效目标上。比如，如果你使用 `AGameplayAbilityTargetActor_SingleLineTrace` 来 trace 目标，那么只有当敌人正好处于 trace 路径上时，`Reticle` 才会出现。如果你把视线移开，敌人就不再是有效目标，`Reticle` 也会消失。如果你希望 `Reticle` 保留在最近一次有效目标上，你就需要自定义 `TargetActor`，让它记住最近一次有效目标，并让 `Reticle` 继续附着在其上。我把这种目标称为 persistent targets，它们会一直保留，直到 `TargetActor` 收到确认或取消、在 trace/overlap 中找到新的有效目标，或者该目标不再有效（被销毁）。GASShooter 在火箭发射器次要能力的 homing rockets 目标选择中使用了 persistent targets。

**[⬆ 返回顶部](#table-of-contents)**

<a name="concepts-targeting-containers"></a>
#### 4.11.5 Gameplay Effect Containers 目标选择

[`GameplayEffectContainers`](#concepts-ge-containers) 自带一种可选且高效的方式来生成 [`TargetData`](#concepts-targeting-data)。这种目标选择会在客户端和服务器上应用 `EffectContainer` 时即时发生。它比 [`TargetActors`](#concepts-targeting-actors) 更高效，因为它运行在目标对象的 CDO 上（不需要生成和销毁 `Actors`），但它缺少玩家输入，立即执行、不需要确认、不能取消，也不能把数据从客户端发到服务器（而是在两边都生成数据）。它非常适合瞬时 trace 和 collision overlap。Epic 的 [Action RPG Sample Project](https://www.unrealengine.com/marketplace/en-US/product/action-rpg) 在它的 containers 中包含了两种目标选择示例：以 ability 的拥有者为目标，以及从 event 中提取 `TargetData`。它还用 Blueprint 实现了一种目标类型，可以在玩家某个偏移位置（由子 Blueprint 类设置）执行即时球形 trace。你可以在 C++ 或 Blueprint 中继承 `URPGTargetType`，编写你自己的目标类型。


**[⬆ 返回顶部](#table-of-contents)**

<a name="cae"></a>
## 5. 常见实现的 Abilities 与

<a name="cae-stun"></a>
### 5.1 眩晕

通常实现眩晕时，我们希望取消 `Character` 当前所有激活中的 `GameplayAbilities`，阻止新的 `GameplayAbility` 激活，并在眩晕持续期间阻止移动。示例项目中的 Meteor `GameplayAbility` 会在命中目标时施加眩晕。

为了取消目标当前激活的 `GameplayAbilities`，我们会在眩晕 [`GameplayTag` 被添加时](#concepts-gt-change)调用 `AbilitySystemComponent->CancelAbilities()`。

为了防止新的 `GameplayAbilities` 在眩晕期间激活，需要在这些 `GameplayAbilities` 的 [`Activation Blocked Tags` `GameplayTagContainer`](#concepts-ga-tags) 中加入眩晕 `GameplayTag`。

为了防止角色在眩晕期间移动，我们会重写 `CharacterMovementComponent` 的 `GetMaxSpeed()` 函数，在拥有者带有眩晕 `GameplayTag` 时返回 0。

**[⬆ 返回顶部](#table-of-contents)**

<a name="cae-sprint"></a>
### 5.2 冲刺

示例项目提供了如何实现冲刺的示例：按住 `Left Shift` 时跑得更快。

更快的移动由 `CharacterMovementComponent` 以 Prediction 方式处理，它会通过网络向服务器发送一个标志位。细节见 `GDCharacterMovementComponent.h/cpp`。

这个 `GA` 负责响应 `Left Shift` 输入，通知 `CMC` 开始和停止冲刺，并在按住 `Left Shift` 时以 Prediction 方式消耗 stamina。细节见 `GA_Sprint_BP`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="cae-ads"></a>
### 5.3 开镜瞄准

示例项目对它的处理方式与 Sprint 完全相同，只不过这里是降低移动速度，而不是提高。

关于如何以 Prediction 方式降低移动速度，见 `GDCharacterMovementComponent.h/cpp`。

关于输入处理，见 `GA_AimDownSight_BP`。开镜瞄准没有 stamina 消耗。

**[⬆ 返回顶部](#table-of-contents)**

<a name="cae-ls"></a>
### 5.4 生命偷取

我是在伤害 [`ExecutionCalculation`](#concepts-ge-ec) 内处理 lifesteal 的。对应的 `GameplayEffect` 会带有一个类似 `Effect.CanLifesteal` 的 `GameplayTag`。`ExecutionCalculation` 会检查 `GameplayEffectSpec` 是否拥有这个 `Effect.CanLifesteal` `GameplayTag`。如果存在，它就会[创建一个动态的 `Instant` `GameplayEffect`](#concepts-ge-dynamic)，把要回复的生命值作为 modifier，并将其应用回 `Source` 的 `ASC`。

```c++
if (SpecAssetTags.HasTag(FGameplayTag::RequestGameplayTag(FName("Effect.Damage.CanLifesteal"))))
{
	float Lifesteal = Damage * LifestealPercent;

	UGameplayEffect* GELifesteal = NewObject<UGameplayEffect>(GetTransientPackage(), FName(TEXT("Lifesteal")));
	GELifesteal->DurationPolicy = EGameplayEffectDurationType::Instant;

	int32 Idx = GELifesteal->Modifiers.Num();
	GELifesteal->Modifiers.SetNum(Idx + 1);
	FGameplayModifierInfo& Info = GELifesteal->Modifiers[Idx];
	Info.ModifierMagnitude = FScalableFloat(Lifesteal);
	Info.ModifierOp = EGameplayModOp::Additive;
	Info.Attribute = UPAAttributeSetBase::GetHealthAttribute();

	SourceAbilitySystemComponent->ApplyGameplayEffectToSelf(GELifesteal, 1.0f, SourceAbilitySystemComponent->MakeEffectContext());
}
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="cae-random"></a>
### 5.5 在客户端与服务器上生成同一个随机数

有时你需要在 `GameplayAbility` 内生成“随机”数，例如子弹后坐力或散布。客户端和服务器都希望生成同样的随机数。要做到这一点，就必须在 `GameplayAbility` 激活时，把 `random seed` 设成相同的值。你需要在每次激活 `GameplayAbility` 时都重新设置 `random seed`，因为客户端可能发生错误 Prediction 激活，从而让它的随机数序列与服务器不同步。

|设置方法| 描述|
| ----------------------------------------------------------------------------| ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| 使用激活|的激活 prediction key 是一个 int16，保证在 `Activation()` 中于客户端和服务器两边同步且可用。你可以在客户端和服务器上都把它设为 `random seed`。这种方法的缺点是 prediction key 每次游戏启动都会从零开始，并以固定方式递增来生成新 key。这意味着每一局都会得到完全相同的随机数序列。对于你的需求来说，它可能够随机，也可能不够。|
| 激活 `GameplayAbility` 时通过 event payload 发送| 通过事件来激活你的 `GameplayAbility`，并把客户端生成的随机 seed 通过复制的 event payload 发送给服务器。这样随机性更强，但客户端也很容易通过修改游戏，让它每次都发送同一个 seed 值。另外，通过事件激活 `GameplayAbilities` 会让它们无法通过输入绑定激活。|

如果你的随机偏移很小，大多数玩家不会注意到每局的序列都相同，那么把激活 prediction key 用作 `random seed` 通常就足够了。如果你做的是更复杂且必须防黑客的逻辑，那么也许 `Server Initiated` 的 `GameplayAbility` 更合适，因为服务器可以创建 prediction key，或者生成 `random seed` 再通过 event payload 发送出去。

**[⬆ 返回顶部](#table-of-contents)**

<a name="cae-crit"></a>
### 5.6 暴击

我是在伤害 [`ExecutionCalculation`](#concepts-ge-ec) 内处理暴击的。对应的 `GameplayEffect` 会带有一个类似 `Effect.CanCrit` 的 `GameplayTag`。`ExecutionCalculation` 会检查 `GameplayEffectSpec` 是否拥有这个 `Effect.CanCrit` `GameplayTag`。如果有，它就会生成一个与暴击几率对应的随机数（这个几率是从 `Source` 捕获的 `Attribute`），如果判定成功，再加上暴击伤害（同样也是从 `Source` 捕获的 `Attribute`）。由于我不对伤害做 Prediction，所以不需要担心客户端和服务器的随机数生成器同步问题，因为 `ExecutionCalculation` 只会在服务器上运行。如果你尝试通过 `MMC` 以 Prediction 方式来做伤害计算，那么你就必须从 `GameplayEffectSpec->GameplayEffectContext->GameplayAbilityInstance` 中拿到 `random seed` 的引用。

看看 [GASShooter](https://github.com/tranek/GASShooter) 是怎么做 headshots 的。原理是一样的，只不过它不是靠随机数判定，而是检查 `FHitResult` 的骨骼名。

**[⬆ 返回顶部](#table-of-contents)**

<a name="cae-nonstackingge"></a>
### 5.7 不可叠加但仅最大幅值生效的

Paragon 中的减速效果不会叠加。每个减速实例仍然会像平常一样被应用并追踪自己的持续时间，但真正影响 `Character` 的，只有幅值最大的那个减速效果。GAS 原生就支持这种场景，通过 `AggregatorEvaluateMetaData` 实现。具体细节与实现见 [`AggregatorEvaluateMetaData()`](#concepts-as-onattributeaggregatorcreated)。

**[⬆ 返回顶部](#table-of-contents)**

<a name="cae-paused"></a>
### 5.8 在游戏暂停时生成

如果你需要在等待玩家通过 `WaitTargetData` `AbilityTask` 生成 [`TargetData`](#concepts-targeting-data) 时暂停游戏，我建议不要真正暂停，而是使用 `slomo 0`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="cae-onebuttoninteractionsystem"></a>
### 5.9 单按键交互系统

[GASShooter](https://github.com/tranek/GASShooter) 实现了一个单按键交互系统，玩家可以按下或按住 `E` 来与可交互对象交互，例如救起玩家、打开武器箱，以及打开或关闭滑动门。


**[⬆ 返回顶部](#table-of-contents)**

<a name="debugging"></a>
## 6. 调试

在调试 GAS 相关问题时，你经常会想知道这些事情：

> * “我的 Attributes 当前值是多少？”
> * “我有哪些 gameplay tags？”
> * “我当前有哪些 Gameplay Effects？”
> * “我被授予了哪些 abilities，哪些正在运行，哪些又被阻止激活？”

GAS 自带两种在运行时回答这些问题的技术：[`showdebug abilitysystem`](#debugging-sd) 和 [`GameplayDebugger`](#debugging-gd) 中的挂钩。

**提示：** Unreal Engine 很喜欢优化 C++ 代码，这会让某些函数很难调试。你在深入追踪代码时偶尔会遇到这个问题。如果把 Visual Studio 的 solution configuration 设为 `DebugGame Editor` 之后，仍然无法单步追踪代码或查看变量，你可以用 `UE_DISABLE_OPTIMIZATION` 和 `UE_ENABLE_OPTIMIZATION` 宏，或 CoreMiscDefines.h 中定义的 shipping 变体，把目标函数包起来以关闭优化。插件代码除非你从源码重建插件，否则不能这样做。对于 inline 函数，这招是否有效取决于它们做了什么以及它们在哪里。调试完后一定要把这些宏删掉！

```c++
UE_DISABLE_OPTIMIZATION
void MyClass::MyFunction(int32 MyIntParameter)
{
	// My code
}
UE_ENABLE_OPTIMIZATION
```

**[⬆ 返回顶部](#table-of-contents)**

<a name="debugging-sd"></a>

在游戏内控制台输入 `showdebug abilitysystem`。这个功能分为三个“页面”。三个页面都会显示你当前拥有的 `GameplayTags`。在控制台输入 `AbilitySystem.Debug.NextCategory` 可以在页面间切换。

第一页会显示你所有 `Attributes` 的 `CurrentValue`：


第二页会显示你身上所有 `Duration` 和 `Infinite` 的 `GameplayEffects`、它们的 stack 数量、赋予了哪些 `GameplayTags`，以及带来了哪些 `Modifiers`。


第三页会显示所有已经授予给你的 `GameplayAbilities`、它们当前是否正在运行、是否被阻止激活，以及当前正在运行的 `AbilityTasks` 状态。


要在目标间切换（当前目标会以 Actor 周围的绿色矩形棱柱表示），可以使用 `PageUp` 键或 `NextDebugTarget` 控制台命令切到下一个目标，使用 `PageDown` 键或 `PreviousDebugTarget` 控制台命令切到上一个目标。

**注意：** 为了让 ability system 信息能根据当前选中的调试 Actor 正确更新，你需要在 `AbilitySystemGlobals` 中把 `bUseDebugTargetFromHud=true`，像这样写到 `DefaultGame.ini` 中：

```
[/Script/GameplayAbilities.AbilitySystemGlobals]
bUseDebugTargetFromHud=true
```

**注意：** 要让 `showdebug abilitysystem` 生效，GameMode 中必须选择一个真实的 HUD 类。否则命令会找不到，并返回 “Unknown Command”。

**[⬆ 返回顶部](#table-of-contents)**

<a name="debugging-gd"></a>
### 6.2 Gameplay 调试器

GAS 为 Gameplay Debugger 增加了功能。按撇号键（`'`）可以打开 Gameplay Debugger。按数字小键盘的 3 可以启用 Abilities 类别。这个类别编号可能会因你启用了哪些插件而不同。如果你的键盘像笔记本一样没有数字小键盘，那么可以在项目设置里修改按键绑定。

当你想查看**其他** `Characters` 身上的 `GameplayTags`、`GameplayEffects` 和 `GameplayAbilities` 时，就使用 Gameplay Debugger。遗憾的是，它不会显示目标 `Attributes` 的 `CurrentValue`。它会自动选取你屏幕中心的那个 `Character` 作为目标。你也可以在 Editor 的 World Outliner 中直接选目标，或者看向另一个 `Character` 再按一次撇号键（`'`）。当前被检查的 `Character` 头顶会有最大的红色圆圈。


**[⬆ 返回顶部](#table-of-contents)**

<a name="debugging-log"></a>
### 6.3 GAS 日志

GAS 源码里包含大量日志语句，并分布在不同的 verbosity 级别。你最常见到的可能是 `ABILITY_LOG()` 语句。默认 verbosity 级别是 `Display`。比它更高的级别默认不会显示在控制台中。

要修改某个 log category 的 verbosity 级别，在控制台输入：

```
log [category] [verbosity]
```

例如，要开启 `ABILITY_LOG()` 语句，你可以在控制台输入：

```
log LogAbilitySystem VeryVerbose
```

要恢复默认值，输入：

```
log LogAbilitySystem Display
```

要显示所有 log categories，输入：

```
log list
```

一些值得注意的 GAS 相关日志类别：

| 日志类别| 默认 Verbosity 级别|
| -------------------------| -----------------------|

更多信息可见 [Wiki on Logging](https://unrealcommunity.wiki/logging-lgpidy6i)。

**[⬆ 返回顶部](#table-of-contents)**

<a name="optimizations"></a>
## 7. 优化

<a name="optimizations-abilitybatching"></a>
### 7.1 Ability 批处理

那些会在一帧内完成激活、可选地向服务器发送 `TargetData`、并结束的 [`GameplayAbilities`](#concepts-ga)，可以[批处理，把两到三个 RPC 压缩成一个](#concepts-ga-batching)。这类 ability 常用于 hitscan 枪械。

<a name="optimizations-gameplaycuebatching"></a>
### 7.2 Gameplay Cue 批处理

如果你同时发送很多 [`GameplayCues`](#concepts-gc)，可以考虑[把它们批处理到一个 RPC 中](#concepts-gc-batching)。目标是减少 RPC 数量（`GameplayCues` 是不可靠的 NetMulticasts），并尽可能少发送数据。

<a name="optimizations-ascreplicationmode"></a>
### 7.3 AbilitySystemComponent Replication 模式

默认情况下，[`ASC`](#concepts-asc) 处于 [`Full Replication Mode`](#concepts-asc-rm)。这会把所有 [`GameplayEffects`](#concepts-ge) 复制到每个客户端（对于单机游戏这没问题）。在多人游戏中，应该把玩家拥有的 `ASCs` 设为 `Mixed Replication Mode`，把 AI 控制的角色设为 `Minimal Replication Mode`。这样，施加到玩家角色上的 `GEs` 只会复制给该角色的拥有者，而施加到 AI 控制角色上的 `GEs` 则永远不会复制到客户端。[`GameplayTags`](#concepts-gt) 仍会复制，而 [`GameplayCues`](#concepts-gc) 无论 `Replication Mode` 如何，仍然会以不可靠 NetMulticast 发送给所有客户端。这样可以减少由于 `GEs` 复制而产生的网络数据，因为并不是所有客户端都需要看到它们。

<a name="optimizations-attributeproxyreplication"></a>
### 7.4 Attribute 代理

在像 Fortnite Battle Royale (FNBR) 这样拥有大量玩家的大型游戏中，会有很多 [`ASCs`](#concepts-asc) 存活在始终相关的 `PlayerStates` 上，并复制大量 [`Attributes`](#concepts-a)。为了优化这个瓶颈，Fortnite 在 **simulated player-controlled proxies** 上，直接在 `PlayerState::ReplicateSubobjects()` 中禁用了 `ASC` 及其 [`AttributeSets`](#concepts-as) 的 Replication。Autonomous proxies 和 AI 控制的 `Pawns` 仍会根据各自的 [`Replication Mode`](#concepts-asc-rm) 进行完整复制。FNBR 不再在始终相关的 `PlayerStates` 上通过 `ASC` 复制 `Attributes`，而是在玩家的 `Pawn` 上使用一个可复制的代理结构体。当服务器端 `ASC` 的 `Attributes` 发生变化时，代理结构体中的值也会同步更新。客户端收到这个代理结构体复制来的 `Attributes` 后，再把这些变化推回到本地 `ASC` 中。这样 `Attribute` 的 Replication 就能利用 `Pawn` 的 relevancy 和 `NetUpdateFrequency`。这个代理结构体还会用 bitmask 复制一小部分白名单 `GameplayTags`。这个优化减少了网络上的数据量，也让我们能利用 pawn relevancy。AI 控制的 `Pawns` 因为 `ASC` 本来就放在 `Pawn` 上，已经使用了它的 relevancy，所以不需要做这个优化。

> 我不确定在后来做了其他服务器端优化（Replication Graph 等）之后，它是否依然必要，而且这也不是最容易维护的模式。

<a name="optimizations-asclazyloading"></a>
### 7.5 ASC 延迟加载

Fortnite Battle Royale (FNBR) 在世界里有很多可受伤的 `AActors`（树、建筑等），每个都有一个 [`ASC`](#concepts-asc)。这会累积出不小的内存成本。FNBR 的优化方式是，只在需要时才延迟加载 `ASCs`（即它们第一次被玩家造成伤害时）。这样可以减少总体内存占用，因为一场比赛里有些 `AActors` 可能永远不会受到伤害。

**[⬆ 返回顶部](#table-of-contents)**

<a name="qol"></a>
## 8. 易用性建议

<a name="qol-gameplayeffectcontainers"></a>

[GameplayEffectContainers](#concepts-ge-containers) 把 [`GameplayEffectSpecs`](#concepts-ge-spec)、[`TargetData`](#concepts-targeting-data)、[简单目标选择](#concepts-targeting-containers) 以及相关功能组合成易于使用的结构体。它们非常适合把 `GameplayEffectSpecs` 传给由 ability 生成的 projectile，然后让 projectile 在稍后碰撞时再应用这些效果。

<a name="qol-asynctasksascdelegates"></a>
### 8.2 用于绑定 ASC Delegates 的

为了提升设计师友好的迭代效率，特别是在为 UI 设计 UMG Widgets 时，可以在 C++ 中创建 Blueprint AsyncTasks，让它们能直接从 UMG Blueprint 图表中绑定 `ASC` 上常见的变化 delegate。唯一要注意的是，这些任务必须手动销毁（比如 widget 销毁时），否则它们会永远留在内存里。示例项目包含了三个 Blueprint AsyncTasks。

监听 `Attribute` 变化：


监听 cooldown 变化：


监听 `GE` stack 变化：


**[⬆ 返回顶部](#table-of-contents)**

<a name="troubleshooting"></a>
## 9. 故障排查

<a name="troubleshooting-notlocal"></a>

你需要[在客户端初始化 `ASC`](#concepts-asc-setup)。

**[⬆ 返回顶部](#table-of-contents)**

<a name="troubleshooting-scriptstructcache"></a>
### 9.2 `ScriptStructCache` 错误

你需要调用 [`UAbilitySystemGlobals::InitGlobalData()`](#concepts-asg-initglobaldata)。

**[⬆ 返回顶部](#table-of-contents)**

<a name="troubleshooting-replicatinganimmontages"></a>
### 9.3 Animation Montages 没有复制到客户端

请确保你在 [GameplayAbilities](#concepts-ga) 中使用的是 `PlayMontageAndWait` Blueprint 节点，而不是 `PlayMontage`。这个 [AbilityTask](#concepts-at) 会通过 `ASC` 自动复制 montage，而 `PlayMontage` 节点不会。

**[⬆ 返回顶部](#table-of-contents)**

<a name="troubleshooting-duplicatingblueprintactors"></a>
### 9.4 复制 Blueprint Actors 会把 AttributeSets 设为

[Unreal Engine 存在一个](https://issues.unrealengine.com/issue/UE-81109)，当 Blueprint Actor 类是从现有 Blueprint Actor 类复制出来时，它会把你类中的 `AttributeSet` 指针设为 nullptr。对此有几个变通办法。我的成功做法是：不要在类上创建专门的 `AttributeSet` 指针（即 .h 中没有指针，构造函数里也不调用 `CreateDefaultSubobject`），而是在 `PostInitializeComponents()` 中直接把 `AttributeSets` 加到 `ASC` 上（示例项目中未展示）。被复制的 `AttributeSets` 仍然会存在于 `ASC` 的 `SpawnedAttributes` 数组里。大致会像这样：

```c++
void AGDPlayerState::PostInitializeComponents()
{
	Super::PostInitializeComponents();

	if (AbilitySystemComponent)
	{
		AbilitySystemComponent->AddSet<UGDAttributeSetBase>();
		// ... any other AttributeSets that you may have
	}
}
```

在这种做法下，你应当通过 `ASC` 上的函数来读取和设置 `AttributeSet` 中的值，而不是[调用由宏生成的 `AttributeSet` 函数](#concepts-as-attributes)。

```c++
/** Returns current (final) value of an attribute */
float GetNumericAttribute(const FGameplayAttribute &Attribute) const;

/** Sets the base value of an attribute. Existing active modifiers are NOT cleared and will act upon the new base value. */
void SetNumericAttributeBase(const FGameplayAttribute &Attribute, float NewBaseValue);
```

因此，`GetHealth()` 大概会像这样：

```c++
float AGDPlayerState::GetHealth() const
{
	if (AbilitySystemComponent)
	{
		return AbilitySystemComponent->GetNumericAttribute(UGDAttributeSetBase::GetHealthAttribute());
	}

	return 0.0f;
}
```

设置（初始化）生命值 `Attribute` 的方式大概会像这样：

```c++
const float NewHealth = 100.0f;
if (AbilitySystemComponent)
{
	AbilitySystemComponent->SetNumericAttributeBase(UGDAttributeSetBase::GetHealthAttribute(), NewHealth);
}
```

提醒一下，`ASC` 对于每个 `AttributeSet` 类，始终只期望最多存在一个 `AttributeSet` 对象。

**[⬆ 返回顶部](#table-of-contents)**

<a name="troubleshooting-unresolvedexternalsymbolmarkpropertydirty"></a>

如果你遇到类似这样的编译错误：

```
error LNK2019: unresolved external symbol "__declspec(dllimport) void __cdecl UEPushModelPrivate::MarkPropertyDirty(int,int)" (__imp_?MarkPropertyDirty@UEPushModelPrivate@@YAXHH@Z) referenced in function "public: void __cdecl FFastArraySerializer::IncrementArrayReplicationKey(void)" (?IncrementArrayReplicationKey@FFastArraySerializer@@QEAAXXZ)
```

这是因为你尝试在 `FFastArraySerializer` 上调用 `MarkItemDirty()`。我在更新 `ActiveGameplayEffect` 时遇到过这个问题，例如更新 cooldown 持续时间时。

```c++
ActiveGameplayEffects.MarkItemDirty(*AGE);
```

实际发生的是，`WITH_PUSH_MODEL` 在不止一个地方被定义了。`PushModelMacros.h` 把它定义成 0，而其他多个地方又把它定义成 1。结果是 `PushModel.h` 看到的是 1，但 `PushModel.cpp` 看到的是 0。

解决方法是在项目的 `Build.cs` 中，把 `NetCore` 加入 `PublicDependencyModuleNames`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="troubleshooting-enumnamesarenowpathnames"></a>
### 9.6 Enum 名称现在以路径名表示

如果你看到类似这样的编译警告：

```
warning C4996: 'FGameplayAbilityInputBinds::FGameplayAbilityInputBinds': Enum names are now represented by path names. Please use a version of FGameplayAbilityInputBinds constructor that accepts FTopLevelAssetPath. Please update your code to the new API before upgrading to the next release, otherwise your project will no longer compile.
```

UE 5.1 已弃用在 `BindAbilityActivationToInputComponent()` 的构造函数中使用 `FString`。现在必须传入 `FTopLevelAssetPath`。

旧的、已弃用的写法：

```c++
AbilitySystemComponent->BindAbilityActivationToInputComponent(InputComponent, FGameplayAbilityInputBinds(FString("ConfirmTarget"),
	FString("CancelTarget"), FString("EGDAbilityInputID"), static_cast<int32>(EGDAbilityInputID::Confirm), static_cast<int32>(EGDAbilityInputID::Cancel)));
```

新的写法：

```c++
FTopLevelAssetPath AbilityEnumAssetPath = FTopLevelAssetPath(FName("/Script/GASDocumentation"), FName("EGDAbilityInputID"));
AbilitySystemComponent->BindAbilityActivationToInputComponent(InputComponent, FGameplayAbilityInputBinds(FString("ConfirmTarget"),
	FString("CancelTarget"), AbilityEnumAssetPath, static_cast<int32>(EGDAbilityInputID::Confirm), static_cast<int32>(EGDAbilityInputID::Cancel)));
```

更多信息见 `Engine\Source\Runtime\CoreUObject\Public\UObject\TopLevelAssetPath.h`。

**[⬆ 返回顶部](#table-of-contents)**

<a name="acronyms"></a>
## 10. 常见 GAS 缩写

| 名称| 缩写|
|-------------------------------------------------------------------------------------------------------| -------------------|

**[⬆ 返回顶部](#table-of-contents)**

<a name="resources"></a>
## 11. 其他资源

* [官方文档](https://docs.unrealengine.com/en-US/Gameplay/GameplayAbilitySystem/index.html)
* 源代码！
* 尤其是 `GameplayPrediction.h`
* [Epic 的 Lyra 示例项目](https://unrealengine.com/marketplace/en-US/learn/lyra)
* [Epic 的 Action RPG 示例项目](https://www.unrealengine.com/marketplace/en-US/product/action-rpg)
* [Unreal Slackers Discord](https://unrealslackers.org/) 有一个专门讨论 GAS 的文字频道 `#gameplay-ability-system`
* 查看置顶消息
* [Dan 'Pan' 的资源 GitHub 仓库](https://github.com/Pantong51/GASContent)
* [SabreDartStudios 的 YouTube 视频](https://www.youtube.com/channel/UCCFUhQ6xQyjXDZ_d6X_H_-A)

<a name="resources-daveratti"></a>
### 11.1 与 Epic 的 Dave Ratti 的问答

<a name="resources-daveratti-community1"></a>
#### 11.1.1 社区问题 1

[Dave Ratti 对 Unreal Slackers Discord 社区关于 GAS 问题的回复](https://epicgames.ent.box.com/s/m1egifkxv3he3u3xezb9hzbgroxyhx89):

1. 我们如何在 `GameplayAbilities` 之外、或者不依赖它的情况下，按需创建局部 prediction window？例如，一个 fire and forget projectile 在命中敌人时，如何在本地以 Prediction 方式应用伤害 `GameplayEffect`？

> PredictionKey 系统其实并不是为这个设计的。从根本上说，这套系统的工作方式是：客户端发起一个可预测动作，用一个 key 告诉服务器，然后客户端和服务器都运行同样的逻辑，并把预测副作用与该 prediction key 关联起来。例如，“我正在以 Prediction 方式激活一个 ability”，或者“我已经生成了 target data，并准备以 Prediction 方式运行 ability graph 中 WaitTargetData 任务之后的部分”。
>
> 在这个模式下，PredictionKey 会从服务器“弹回来”，通过 `UAbilitySystemComponent::ReplicatedPredictionKeyMap`（复制属性）再返回给客户端。一旦 key 从服务器复制回客户端，客户端就可以撤销所有本地 Prediction 的副作用（`GameplayCues`、`GameplayEffects`）：复制版本*应该已经存在*，如果不存在，那就是一次错误 Prediction。精确知道何时撤销这些预测副作用在这里至关重要：如果太早，你会看到空档；如果太晚，你会看到“双份”。（注意，这里说的是有状态的 Prediction，例如持续时间型 `Gameplay Effect` 上循环播放的 `GameplayCue`。“Burst” `GameplayCues` 和瞬时 `Gameplay Effects` 永远不会被“撤销”或回滚。若它们带有关联的 prediction key，客户端只会跳过它们。）
>
> 进一步强调一点：Prediction 动作必须是服务器不会主动自己做的事情，而只能在客户端通知它之后才做。所以，泛化成“按需创建一个 key 并告诉服务器，这样我就能运行某些东西”的方案是行不通的，除非那个“某些东西”本身就是服务器只有在客户端通知后才会执行的。
>
> 回到最初的问题，例如 fire and forget projectile。Paragon 和 Fornite 都有使用 `GameplayCues` 的 projectile actor 类，但我们并不是用 Prediction Key 系统来做这个。相反，我们有一个 Non-Replicated `GameplayCues` 的概念。也就是仅在本地触发、服务器完全跳过的 `GameplayCues`。本质上，它们就是直接调用 `UGameplayCueManager::HandleGameplayCue`。它们不会经过 `UAbilitySystemComponent`，因此不会做 prediction key 检查或提前返回。
>
> Non-Replicated `GameplayCues` 的缺点显而易见：它们不做 Replication。因此 projectile 类
>
> 这类事件本来就已经在客户端生成了，所以调用一个 non replicated gameplay cue 并不是什么大问题。复杂 Blueprint 可能会比较棘手，作者必须自己确保搞清楚哪些逻辑运行在什么地方。

2. 在本地 Prediction 的 `GameplayAbility` 中，使用带 `OnlyServerWait` 的 `WaitNetSync` `AbilityTask` 来创建局部 prediction window 时，玩家是否可能通过延迟发往服务器的包来操纵 `GameplayAbility` 的时机，因为服务器正在等待带有 prediction key 的 RPC？这在 Paragon 或 Fortnite 中曾经是问题吗？如果是，Epic 是如何缓解的？

> 是的，这是一个合理的顾虑。任何在服务器上运行、并等待客户端“信号”的 ability blueprint，都可能受到 lag switch 类作弊的利用。
>
> Paragon 有一个类似 `UAbilityTask_WaitTargetData` 的自定义 targeting task。在这个任务里，对于瞬时 targeting 模式，我们设置了超时，也就是客户端允许的“最大延迟”。如果 targeting 模式需要等待用户确认（按按钮），那就不会受这个限制，因为用户本来就可以慢慢操作。但对于那些即时确认目标的 abilities，我们只会等待一定时间，时间到了就要么 A）在服务器端生成 target data，要么 B）取消该 ability。
>
> 对于 `WaitNetSync`，我们从来没有类似的机制，而我们自己也很少用它。
>
> 我不认为 Fortnite 用了类似这样的东西。Fortnite 的武器 abilities 做了特判，并被 batch 成一个 fortnite-specific RPC：一个 RPC 就能激活 ability、提供 target data 并结束 ability。所以在 Battle Royale 里，武器 abilities 从机制上就不容易受到这个问题的影响。
>
> 我的看法是，这个问题理论上可以做成系统级解决方案，但我不觉得我们近期会自己去改。针对你提到的场景，给 `WaitNetSync` 增加一个最大延迟，应该算是一个合理的修复任务，但同样地，短期内我们不太可能去做。

3. Paragon 和 Fortnite 使用的是哪种 `EGameplayEffectReplicationMode`？Epic 对于何时使用每种模式有什么建议？

> 这两个游戏本质上都是：玩家控制角色用 Mixed 模式，AI 控制角色（AI 小兵、野怪、AI Husks 等）用 Minimal。我会把这作为大多数多人游戏使用这套系统时的推荐配置。越早在项目中设好这些，越好。
>
> Fortnite 在优化方面还更进一步。对于 simulated proxies，它实际上根本不复制 `UAbilitySystemComponent`。组件以及 attribute 子对象会在 Fortnite 自己的 player state 类的 `::ReplicateSubobjects()` 中被跳过。我们只会把 ability system component 中最少量必须复制的数据推送到 pawn 本身的一个结构体上（本质上是 attribute 值的一个子集，以及一个通过 bitmask 向下复制的白名单 tag 子集）。我们称之为 “proxy”。接收方会拿到复制到 pawn 上的 proxy 数据，再把它推回 player state 上的 ability system component。所以在 FNBR 中，每个玩家确实都有一个 ASC，只是它不直接做 Replication：它通过 pawn 上的最小 proxy struct 复制数据，然后在接收端再回流到 ASC。这样做的优势是：A）数据更少；B）能利用 pawn relevancy。
>
> 我不确定在后来做了其他服务器端优化（Replication Graph 等）之后，它是否依然必要，而且这也不是最容易维护的模式。

4. 既然按 `GameplayPrediction.h` 的说明我们无法预测 `GameplayEffects` 的移除，那么有什么策略可以缓解移除 `GameplayEffects` 时延迟带来的影响吗？例如，移除一个减速效果时，我们现在必须等待服务器复制 `GameplayEffect` 的移除，结果就会让玩家角色位置出现一次突跳。

> 这个问题很棘手，我没有一个很好的答案。我们通常是靠容差和 smoothing 来绕开这些问题。我完全同意，ability system 和角色移动系统之间的精确同步目前并不理想，这确实是我们想修的事情。
>
> 我曾经有过一个允许以 Prediction 方式移除 GEs 的方案，但在不得不转去做别的事情之前，始终没能把所有边界情况处理好。不过即使做到了，这也不能完全解决问题，因为角色移动系统内部仍有一个保存移动的缓冲区，它对 ability system 以及可能影响移动速度的 modifier 一无所知。即使不考虑无法预测移除 GEs 的问题，依然可能进入 correction feedback loop。
>
> 如果你觉得自己遇到的是一个真的很棘手的场景，你可以尝试以 Prediction 方式添加一个会抑制你那些移动速度 GEs 的 GE。我自己没实际这么做过，但以前推演过这个思路。它也许能帮助解决某一类问题。

5. 我们知道在 Paragon 和 Fortnite 中，`AbilitySystemComponent` 放在 `PlayerState` 上，而在 Action RPG Sample 中则放在 `Character` 上。Epic 内部关于 AbilitySystemComponent 应该放在哪里，以及它的 `Owner` 应该是谁，有什么规则、准则或建议？

> 一般来说，凡是不需要重生的对象，都应该让 Owner 和 Avatar actor 是同一个东西。像 AI 敌人、建筑、场景道具等等。
>
> 任何会重生的对象，都应该让 Owner 和 Avatar 不同，这样 Ability System Component 就不需要在重生后再去保存

6. 是否可行：拥有多个 `AbilitySystemComponents`，它们共享同一个 owner，但有不同的 avatar（例如分别挂在 pawn 和 weapon/items/projectiles 上，并把 `Owner` 设为 `PlayerState`）？

> 我首先看到的问题会是：如何在 owning actor 上实现 `IGameplayTagAssetInterface` 和 `IAbilitySystemInterface`。前者也许还有可能：把所有 ASC 的 tags 聚合起来即可（但要注意，`HasAllMatchingGameplayTags` 可能只会在跨 ASC 聚合后才成立。不能只是把调用转发给每个 ASC 然后把结果 OR 起来）。后者则更棘手：哪个 ASC 才是权威的？如果有人想应用一个 GE，该给哪一个？也许这些问题你都能想办法解决，但最难的一部分一定会在这里：owner 下面挂了多个 ASC。
>
> 不过，pawn 和 weapon 各自有独立 ASC，这件事本身是说得通的。比如，用来区分描述 weapon 的 tags 和描述拥有它的 pawn 的 tags。也许让 weapon 获得的 tags 同时“作用”到 owner 身上，而其他方面（例如 attributes 和 GEs）仍然相互独立，是有道理的；owner 再像我上面说的那样聚合这些 owned tags。这种方案应该是能工作的，我很确定。但多个 ASC 共用同一个 owner，可能会变得很棘手。

7. 有没有办法阻止服务器覆盖拥有者客户端上本地 Prediction ability 的 cooldown 持续时间？在高延迟场景下，这样拥有者客户端就可以在本地 cooldown 结束时“尝试”再次激活 ability，即便服务器上它仍然在 cooldown 中。等拥有者客户端的激活请求通过网络到达服务器时，服务器可能已经脱离 cooldown，或者服务器可以把这个请求排队等待剩余的几毫秒。否则照现在这样，延迟更高的客户端在 ability 重新激活前会比低延迟玩家多出一段额外等待。这个问题在 cooldown 很短的 ability 上尤其明显，例如基础攻击可能不到一秒。如果无法阻止服务器覆盖本地 Prediction ability 的 cooldown 持续时间，那么 Epic 是如何缓解高延迟对 ability 再激活影响的？换一种说法，Epic 是如何设计 Paragon 的基础攻击和其他 abilities，让高延迟玩家也能像低延迟玩家一样，以本地 Prediction 的方式同样频率地攻击或激活？

> 简短回答是：没有办法阻止，而且 Paragon 确实有这个问题。延迟更高的连接在基础攻击上的 ROF 会更低。
>
> 我曾尝试通过加入 “GE reconciliation” 来修复这个问题，也就是在计算 GE 持续时间时把延迟考虑进去。本质上是允许服务器吃掉一部分 GE 总时长，从而让客户端看到的 GE 实际持续时间在任何延迟下都保持 100% 一致（尽管延迟抖动依然可能带来问题）。但我始终没能把它做到可上线的程度，项目推进又很快，所以最终我们并没有彻底解决它。
>
> Fortnite 会自己记录武器射速：它不会用 GEs 来做武器 cooldown。如果这个问题对你的游戏非常关键，我会推荐这么做。

8. Epic 对 GameplayAbilitySystem 插件的路线图是什么？Epic 计划在 2019 年及以后加入哪些功能？

> 我们觉得总体上这个系统目前已经比较稳定了，也没有人在做重大的新功能。现在更多只是偶尔为了 Fortnite，或者根据 UDN
>
> 更长期来看，我觉得我们最终会做一个 “V2”，或者至少做一些大的变更。我们从编写这套系统中学到了很多，也知道自己有些地方做对了，有些地方做错了。我很希望有机会纠正这些错误，并改进上面提到的一些致命缺陷。
>
> 如果 V2 真的有一天要来，提供升级路径会是重中之重。我们绝不会做一个 V2 然后让 Fortnite 永远停留在 V1：一定会有一些路径或流程，能自动迁移尽可能多的内容，尽管仍然几乎肯定会需要一些手工重做。
>
> 高优先级修复会是：
> * 与角色移动系统更好的互操作性。统一客户端 Prediction。
> * GE 移除 Prediction（问题 #4）
> * GE 延迟 reconciliation（问题 #7）
> * 通用的网络优化，例如批处理 RPC 和代理结构。基本上就是我们在 Fortnite 里做过的大部分事情，但要把它们拆解成更通用的形式，至少让游戏更容易编写自己的项目级优化。
>
> 我会考虑做的一些更通用的重构类改动：
> * 我想从根本上让 GEs 摆脱直接引用表格数值的方式。相反，它们应该能够发出参数，这些参数再由某个绑定了表格数值的更高层对象来填充。当前模型的问题是，GEs 因为和 curve table 行耦合过紧而无法共享。我认为可以写一套通用的参数化系统，作为 V2 的基础。
> * 减少 `UGameplayAbility` 上 “policies” 的数量。我会移除 `ReplicationPolicy` 和 `InstancingPolicy`。在我看来，Replication 几乎从来都不是真的需要，而且还容易引起困惑。`InstancingPolicy` 则应该被替换为：让 `FGameplayAbilitySpec` 成为一个可被继承的 UObject。它本来就应该是那个“非实例化的 ability object”，带事件、可 Blueprint 化。而 `UGameplayAbility` 应该成为“每次执行时实例化”的对象。是否真的需要实例化可以变成可选；“non instanced” abilities 则通过新的 `UGameplayAbilitySpec` 对象来实现。
> * 系统应该提供更多“中层”构件，例如“filtered GE application container”（用数据驱动决定把哪些 GEs 应用到哪些 actors，并包含更高层的 gameplay 逻辑）、“overlapping volume support”（基于碰撞体 overlap 事件来应用这个 “Filtered GE application container”）等等。这些几乎是每个项目都会自己实现的积木块，而把它们真正做好并不简单，所以我认为我们应该更好地提供一些基础实现。
> * 总体上，减少把项目跑起来所需的样板代码。也许会有一个独立模块，比如 “Ex library” 之类，可以开箱即用地提供被动 abilities 或基础 hitscan weapons。这会是一个可选模块，但可以让你快速起步。
> * 我还希望把 `GameplayCues` 拆到一个独立模块里，不再和 ability system 紧耦合。我觉得这里还能做很多改进。

> 这只是我个人的看法，不代表任何人的承诺。我认为最现实的路线是：随着新的引擎技术计划推进，ability system 也需要随之更新，而那会是做这类事情的合适时机。这些计划可能和脚本、网络，或物理

**[⬆ 返回顶部](#table-of-contents)**

<a name="resources-daveratti-community2"></a>
#### 11.1.2 社区问题 2

社区成员 [iniside](https://github.com/iniside) 与 Dave Ratti 的问答：

1. 是否计划支持解耦的固定 tick？我希望 Game Thread 是固定的（比如 30/60fps），而渲染线程自由运行。我之所以问，是因为想判断这是不是未来值得预期的方向，从而对 gameplay 如何工作做一些假设。我主要这么问，是因为现在物理已经有固定的异步 tick，这就引出了剩余系统未来会如何工作的疑问。我不掩饰地说，如果能让 game thread 固定 tick，而不需要把整个引擎其他部分也都固定 tick，那会非常棒。

> 没有计划把渲染帧率和 game thread tick 帧率解耦。我觉得由于这些系统的复杂度，以及必须保持与旧版本引擎向后兼容，这艘船已经开走了，基本不太可能再做成。
>
> 相反，我们目前的方向是引入一个异步的 “Physics Thread”，它以固定 tick 率运行，并独立于 game thread。那些需要固定频率运行的东西可以放在这里运行，而 game thread
>
> 值得澄清的是，Network Prediction 支持它所谓的 Independent Ticking 和 Fixed Ticking 模式。我的长期计划是让 Independent Ticking 基本维持现在的样子，即在 Network Prediction 中运行在 game thread 上，使用可变帧率，而且没有“group

2. 是否已有计划考虑 Network Prediction 将如何与 Ability System 集成？比如，固定帧的 ability 激活（服务器接收到的是 ability 被激活和 tasks 被执行的帧号，而不是 prediction keys）？

> 有，计划是重写
>
> 核心想法是，移除 ASC RPC 中显式的 client->server Prediction Key 交换。将不再有 prediction windows 或 scoped prediction keys。所有东西都会围绕 NetworkPrediction frames 来组织。关键点在于客户端和服务器要在“事情何时发生”这件事上达成一致。例如：
>
> * abilities 何时被激活
> * Gameplay Effects 何时被应用
> * Attribute 值（某个 Attribute 在第 X 帧的值是多少）
>
> 我认为这可以在 ability system 层面以通用方式完成。但如果要让用户自己在 `UGameplayAbility` 里的逻辑完全可回滚，仍然还需要更多工作。我们最后也许会有一个 `UGameplayAbility` 的子类，它可以完全回滚，但只能访问一组更受限的功能，或者只能用那些被标记为 rollback-friendly 的 Ability Tasks。大概类似这样。动画事件、root motion 以及它们的处理方式也会带来很多影响。
>
> 希望我能给出更明确的答案，但在再次触碰 GAS 之前，先把底层打牢非常重要。移动和物理必须足够稳固，才能去改高层系统。

3. 是否有计划把 Network Prediction 的开发推进到主分支？说实话，我真的很想看看最新代码，不管它现在是什么状态。

> 我们正在朝这个方向推进。系统层面的工作仍然都在 `NetworkPrediction` 中进行（见 `NetworkPhysics.h`），底层的异步物理部分应该也都已经可用了（`RewindData.h` 等）。不过我们在 Fortnite 中也有一些专注中的用例，那些显然不能公开。我们还在处理 bug、做性能优化等等。
>
> 补充一点背景：在做这套系统早期版本时，我们非常关注“前端”层面的东西，也就是状态和模拟该如何定义、如何编写。那时我们学到了很多。但随着异步物理逐渐可用，我们更多地在关注如何让某些真实功能在这个系统里真正跑起来，即便代价是抛弃一些早期抽象。我们的目标是在真实方案跑通之后，再回过头来把这些东西重新统一起来。比如，重新回到“前端”层，在我们现在正在做的核心技术之上，把那个最终版本做出来。

4. 主分支上曾经有一个用于发送 Gameplay Messages 的插件（看起来像 Event/Message Bus），后来被移除了。是否计划恢复它？结合 Game Features/Modular Gameplay 插件，一个通用的 Event Bus Dispatcher 会非常有用。

> 我想你说的是 GameplayMessages 插件。它大概率会在某个时间点回来，目前 API 还没有真正定型，作者原本也没打算这么早公开它。我同意，它对模块化 gameplay 设计应该会很有用。但这不是我负责的领域，所以我没有更多信息。

5. 我最近一直在玩异步固定物理，结果很有希望。不过如果未来还会有 NP 更新，我大概也只能边玩边等，因为为了让它工作，我仍需要把整个引擎都拉进 fixed tick；另一方面我又想把物理保持在 33ms，这会导致如果一切都在 30fps 下跑，体验并不好 (:。

   我注意到有一些关于 Async CharacterMovementComponent 的工作，但不确定它会不会使用 Network Prediction，还是说这是另一条独立路线？

   因为注意到了这点，我也尝试自己实现了一个固定 tick 率的自定义异步移动，效果还行，但在这之上我还得额外加一套插值更新。我的做法是：在独立 worker threads 上以固定 33ms 运行 simulation tick，完成计算并保存结果，然后在 game thread 上进行插值，以匹配当前帧率。并不完美，但能完成任务。

   我的问题是，未来这件事是否会更容易搭起来，因为现在需要写相当多的样板代码（主要是插值部分），而且逐个对象插值也并不高效。

   这些异步东西真的很有意思，因为它们让你可以真正以固定更新率运行游戏模拟（这样固定 thread 也就不需要了），而且结果更可预测。这会是未来的既定方向，还是只会对某些系统有帮助？据我所知 actor transforms 还不是异步更新的，Blueprints 也并非完全线程安全。换句话说，未来它会在框架层面得到更多支持，还是仍然需要每个游戏自己解决？

>
> 这基本上只是一个早期原型
>
> 我仍需要把整个引擎都拉进 fixed tick；另一方面我又想把物理保持在 33ms。这会导致如果一切都在 30 fps 下跑，体验并不好 (:。
>
> 这些异步东西真的很有意思，因为它们让你可以真正以固定更新率运行游戏模拟（这样固定 thread 也就不需要了）
>
> 是的。这里的目标是：开启异步物理后，你可以让引擎继续以可变 tick 率运行，而物理和“核心” gameplay 模拟则以固定速率运行（例如 character movement、vehicles、GAS 等）。
>
> 这是当前启用该功能需要设置的 cvars：（我想你应该已经弄明白了）
>
> Chaos 的确为物理状态提供了插值（例如那些被推回到 `UPrimitiveComponent` 并对游戏代码可见的 transform）。现在有一个 cvar：`p.AsyncInterpolationMultiplier`，如果你想看可以研究一下它。你应该能看到物理刚体的平滑连续运动，而不需要自己额外写代码。
>
> 如果你想插值非物理状态，那目前仍然需要你自己做。一个例子就是 cooldown：你可能希望它在异步 physics thread 上更新（tick），但在 game thread 上看到平滑连续的插值，从而每一帧渲染时 cooldown 可视化都在更新。我们迟早会做到这一点，但现在还没有示例。
>
> 现在要写的样板代码确实很多，
>
> 是的，这一直是这套系统迄今为止的一个大问题。我们希望提供一个接口，让经验丰富的程序员可以最大化性能和安全性（也就是那种能写出“天然就能做 Prediction”的 gameplay 代码、同时尽量减少陷阱和“虽然能做但最好别做”的事情）。因此像 CharacterMovement 这样的系统，可能会做大量定制化工作来榨取性能，比如写模板代码、做批量更新、做宽向量化、把更新循环拆成不同阶段等等。对于这种用例，我们希望为异步线程和回滚系统提供一个良好的“低层”接口。而且在这种情况下，角色移动系统本身仍然应该能以它自己的方式扩展，例如提供 Blueprint 自定义 movement mode 的能力，以及线程安全的 Blueprint API。
>
> 但我们也清楚，这对于更简单的 gameplay 对象是不可接受的，它们其实并不需要自己的一整套“系统”。这里需要的是一种更符合 Unreal 风格的方案。例如利用反射系统、提供通用 Blueprint 支持等等。其实已经有一些 Blueprint 在其他线程上使用的例子（见 `BlueprintThreadSafe` 关键字，以及动画系统正在推进的方向）。所以我认为将来某一天一定会有某种形式的这类能力。但同样地，我们现在还没到那个阶段。
>
> 我知道你主要是在问插值，但总体答案就是：现在我们仍要求你手工做所有事情，比如 `NetSerialize`、`ShouldReconcile`、`Interpolate` 等；而未来我们会提供一种方式，让你“如果只想用反射系统，就不必手写这些东西”。我们只是不想*强迫*所有人都走反射系统，因为那会带来其他限制，而我们认为底层系统不应该承受这些限制。
>
> 再把它和我前面说的话串起来：现在我们真正专注的是先让少数几个非常具体的示例跑通并且性能达标，然后再把注意力转回前端层面，让系统更易用、更方便迭代、减少样板代码，好让其他人都能用起来。

**[⬆ 返回顶部](#table-of-contents)**

<a name="changelog"></a>
## 12. GAS 更新日志

这是根据官方 Unreal Engine 升级更新日志以及我遇到的一些未文档化变更整理出的 GAS 重要变更列表（包括修复、变更和新功能）。如果你发现了未列出的内容，请提交 issue 或 pull request。

<a name="changelog-5.3"></a>
### 5.3

* 崩溃修复：修复了 seamless travel 之后尝试应用 Gameplay Cues 时发生的崩溃。
* 崩溃修复：修复了使用 Live Coding 时由 GlobalAbilityTaskCount 导致的崩溃。
* 崩溃修复：修复了 `UAbilityTask::OnDestroy` 在如 `UAbilityTask_StartAbilityState` 这类递归调用场景下崩溃的问题。
* Bug 修复：现在在子类中调用 `Super::ActivateAbility` 是安全的。此前它会调用 `CommitAbility`。
* Bug 修复：增加了对不同类型 `FGameplayEffectContext` 正确进行 Replication 的支持。
* Bug 修复：`FGameplayEffectContextHandle` 现在在获取 “Actors” 前会先检查数据是否有效。
* Bug 修复：保留 Gameplay Ability System Target Data LocationInfo 的旋转信息。
* Bug 修复：Gameplay Ability System 现在仅在找到有效 PC 时才停止搜索 PC。
* Bug 修复：`RemoveGameplayCue_Internal` 中如果已有 `GameplayCueParameters`，则使用现有参数，而不是默认参数对象。
* Bug 修复：`GameplayAbilityWorldReticle` 现在会朝向 source Actor，而不是 `TargetingActor`。
* Bug 修复：如果通过 `GiveAbilityAndActivateOnce` 传入了触发事件数据，并且 ability 列表被锁定，则会缓存该事件数据。
* Bug 修复：增加了对 `FInheritedGameplayTags` 立即更新其 `CombinedTags` 的支持，而不是等到 Save 时再更新。
* Bug 修复：将 `ShouldAbilityRespondToEvent` 从仅客户端代码路径移到了客户端和服务器共同代码路径。
* Bug 修复：修复了 `FAttributeSetInitterDiscreteLevels` 因 Curve Simplification 导致在 Cooked Builds 中无法工作的问题。
* Bug 修复：在 `GameplayAbility` 中设置 `CurrentEventData`。
* Bug 修复：确保在可能执行回调前，`MinimalReplicationTags` 已正确设置。
* Bug 修复：修复了 `ShouldAbilityRespondToEvent` 没有在实例化的 `GameplayAbility` 上被调用的问题。
* Bug 修复：当 `gc.PendingKill` 被禁用时，在子 Actor 上执行的 Gameplay Cue Notify Actors 不再泄漏内存。
* Bug 修复：修复了 `GameplayCueManager` 中因哈希冲突导致 `GameplayCueNotify_Actors` 可能“丢失”的问题。
* Bug 修复：`WaitGameplayTagQuery` 现在即使 Actor 上没有 Gameplay Tags，也会正确遵循其 Query。
* Bug 修复：`PostAttributeChange` 和 `AttributeValueChangeDelegates` 现在会带有正确的 `OldValue`。
* Bug 修复：修复了当 `FGameplayTagQuery` 由原生代码创建时，不显示正确 Query Description 的问题。
* Bug 修复：确保在使用 Ability System 时调用 `UAbilitySystemGlobals::InitGlobalData`。此前如果用户不调用它，Gameplay Ability System 将无法正确工作。
* Bug 修复：修复了从 `UGameplayAbility::EndAbility` 链接/取消链接 anim layers 时的问题。
* Bug 修复：更新了 Ability System Component 函数，在使用前检查 Spec 的 ability 指针。
* 新增：在 `FGameplayTagRequirements` 中新增了 `GameplayTagQuery` 字段，以支持更复杂的需求描述。
* 新增：引入了 `FGameplayEffectQuery::SourceAggregateTagQuery` 以增强 `SourceTagQuery`。
* 新增：扩展了通过控制台命令执行和取消 Gameplay Abilities 与 Gameplay Effects 的功能。
* 新增：新增了对 Gameplay Ability Blueprints 执行 “Audit” 的能力，用于显示它们如何开发及预期如何使用的信息。
* 变更：对于按 Actor 实例化的 Gameplay Abilities，`OnAvatarSet` 现在会在主实例上调用，而不是在 CDO 上调用。
* 变更：允许在同一个 Gameplay Ability Graph 中同时使用 Activate Ability 和 Activate Ability From Event。
* 变更：`AnimTask_PlayMontageAndWait` 现在提供了开关，允许在 `BlendOut` 事件之后仍然触发 Completed 和 Interrupted。
* 变更：`ModMagnitudeCalc` 包装函数现在被声明为 const。
* 变更：`FGameplayTagQuery::Matches` 现在对空查询返回 false。
* 变更：更新了 `FGameplayAttribute::PostSerialize`，将包含的 attribute 标记为可搜索名称。
* 变更：更新了 `GetAbilitySystemComponent`，其默认参数现在为 `Self`。
* 变更：将 `AbilityTask_WaitTargetData` 中的一些函数标记为 virtual。
* 变更：移除了未使用的函数 `FGameplayAbilityTargetData::AddTargetDataToGameplayCueParameters`。
* 变更：移除了遗留的 `GameplayAbility::SetMovementSyncPoint`。
* 变更：移除了 Gameplay tasks 与 Ability system components 上未使用的 Replication 标志。
* 变更：将部分 gameplay effect 功能移动到了可选组件中。所有现有内容会在必要时于 `PostCDOCompiled` 中自动更新为使用这些组件。


<a name="changelog-5.2"></a>
### 5.2

* Bug 修复：修复了 `UAbilitySystemBlueprintLibrary::MakeSpecHandle` 函数中的崩溃。
* Bug 修复：修复了 Gameplay Ability System 中的一段逻辑问题：一个非受控 Pawn 即使是在服务器本地生成的，也会被视为远端（例如 Vehicles）。
* Bug 修复：正确设置了那些被服务器拒绝的、带 Prediction 的实例化 abilities 的 activation info。
* Bug 修复：修复了一个会导致 GameplayCues 卡在远端实例上的 bug。
* Bug 修复：修复了链式调用 `WaitGameplayEvent` 时的内存踩踏问题。
* Bug 修复：在 Blueprint 中调用 AbilitySystemComponent 的 `GetOwnedGameplayTags()` 时，同一个节点多次执行后将不再保留上次调用的返回值。
* Bug 修复：修复了 `GameplayEffectContext` 复制一个永远不会被复制的动态对象引用的问题。
* 这曾导致 `GameplayEffect` 无法调用 `Owner->HandleDeferredGameplayCues(this)`，因为 `bHasMoreUnmappedReferences` 会一直为 true。
* 新增：[Gameplay Targeting System](https://docs.unrealengine.com/en-US/gameplay-targeting-system-in-unreal-engine/) 是一种创建数据驱动目标请求的方法。
* 新增：新增了对 GameplayTag Queries 自定义序列化的支持。
* 新增：新增了对派生 `FGameplayEffectContext` 类型进行 Replication 的支持。
* 新增：资产中的 Gameplay Attributes 现在会在保存时注册为可搜索名称，从而可以在 reference viewer 中看到对 attributes 的引用。
* 新增：为 AbilitySystemComponent 添加了一些基础单元测试。
* 新增：Gameplay Ability System Attributes 现在会遵循 Core Redirects。这意味着现在你可以在代码中重命名 Attribute Sets 及其 Attributes，并且只要在 `DefaultEngine.ini` 中添加 redirect 条目，旧名字保存的资产也能被正确加载。
* 变更：允许从代码中修改 Gameplay Effect Modifier 的 evaluation channel。
* 变更：从 Gameplay Abilities Plugin 中移除了之前未使用的变量 `FGameplayModifierInfo::Magnitude`。
* 变更：移除了 ability system component 与 Smart Object 实例 tags 之间的同步逻辑。


<a name="changelog-5.1"></a>
### 5.1

* Bug 修复：修复了 replicated loose gameplay tags 没有复制给 owner 的问题。
* Bug 修复：修复了 AbilityTask 可能阻止 abilities 被及时垃圾回收的问题。
* Bug 修复：修复了一个问题：基于 tag 监听激活的 gameplay ability 有时无法激活。当有多个 Gameplay Ability 监听同一个 tag，而列表中的第一个无效或没有激活权限时，就会发生。
* Bug 修复：修复了使用 Data Registries 的 GameplayEffects 在加载时错误警告的问题，并改进了警告文本。
* Bug 修复：移除了 `UGameplayAbility` 中一段错误代码；此前它只会把最后一个实例化 ability 注册到 Blueprint 调试器以支持断点。
* Bug 修复：修复了当 `EndAbility` 在 `ApplyGameplayEffectSpecToTarget` 内部锁期间被调用时，Gameplay Ability System Ability 可能卡住的问题。
* 新增：新增支持让 Gameplay Effects 添加 blocked ability tags。
* 新增：新增了 `WaitGameplayTagQuery` 节点。一个基于 `UAbilityTask`，另一个基于 `UAbilityAsync`。该节点指定一个 `TagQuery`，并根据配置在查询变为 true 或 false 时触发输出 pin。
* 新增：修改了控制台变量中的 AbilityTask 调试行为，在非 shipping 构建中默认启用调试录制和日志打印（并可按需热修开关）。
* 新增：现在可以把 `AbilitySystem.AbilityTask.Debug.RecordingEnabled` 设为 0 来禁用，设为 1 在非 shipping 构建中启用，设为 2 在所有构建中启用（包括 shipping）。
* 新增：可以使用 `AbilitySystem.AbilityTask.Debug.AbilityTaskDebugPrintTopNResults` 只在日志中打印前 N 个结果（避免日志刷屏）。
* 新增：可使用 `STAT_AbilityTaskDebugRecording` 来测试这些默认开启调试改动带来的性能影响。
* 新增：新增了一个用于过滤 GameplayCue 事件的调试命令。
* 新增：为 Gameplay Ability System 新增了调试命令 `AbilitySystem.DebugAbilityTags`、`AbilitySystem.DebugBlockedTags` 和 `AbilitySystem.DebugAttribute`。
* 新增：新增了一个 Blueprint 函数，用于获取 Gameplay Attribute 的调试字符串表示。
* 新增：新增了一个 Gameplay Task resource overlap policy，用于取消现有 tasks。
* 变更：现在 Ability Tasks 在调用 `Super::OnDestroy` 之前，应确保先完成所有需要访问 Ability 指针的工作，因为调用后该指针会被清空。
* 变更：将 `FGameplayAbilitySpec/Def::SourceObject` 改为弱引用。
* 变更：把 Ability Task 中的 Ability System Component 引用改为弱指针，以便垃圾回收能删除它。
* 变更：移除了冗余枚举 `EWaitGameplayTagQueryAsyncTriggerCondition`。
* 变更：`GameplayTasksComponent` 和 `AbilitySystemComponent` 现在支持 registered subobject API。
* 变更：增加了更好的日志，以指出为什么 Gameplay Abilities 激活失败。
* 变更：移除了 `AbilitySystem.Debug.NextTarget` 和 `PrevTarget` 命令，改为使用全局 HUD 的 `NextDebugTarget` 和 `PrevDebugTarget` 命令。


<a name="changelog-5.0"></a>
### 5.0

https://docs.unrealengine.com/5.0/en-US/unreal-engine-5.0-release-notes/

<a name="changelog-4.27"></a>
### 4.27

* 崩溃修复：修复了一个 root motion source 问题：当 Actor 完成执行一个使用恒定力 root motion task 且带有随时间变化强度 modifier 的 ability 时，网络客户端可能崩溃。
* Bug 修复：修复了使用 GameplayCues 时 Editor 加载时间回归的问题。
* Bug 修复：`GameplayEffectsContainer` 的 `SetActiveGameplayEffectLevel` 方法在设置相同 `EffectLevel` 时将不再把 FastArray 标记为 dirty。
* Bug 修复：修复了 GameplayEffect mixed replication mode 下的一个边界问题：那些虽然并未被 net connection 显式拥有，但通过 `GetNetConnection` 使用该连接的 Actors，将不再收不到 mixed replication 更新。
* Bug 修复：修复了 GameplayAbility 的类方法 `EndAbility` 中的无限递归问题，该问题由在 `K2_OnEndAbility` 中再次调用 `EndAbility` 导致。
* Bug 修复：如果 GameplayTags Blueprint pins 在 tags 注册前被加载，它们将不再被静默清空。现在它们的行为与 GameplayTag 变量一致，两者都可以通过项目设置中的 `ClearInvalidTags` 选项调整。
* Bug 修复：提升了 GameplayTag 操作的线程安全性。
* 新增：向 GameplayAbility 的 `K2_CanActivateAbility` 方法暴露了 `SourceObject`。
* 新增：原生 GameplayTags。引入了新的 `FNativeGameplayTag`，使得定义一次性的原生 tags 成为可能，并且在模块加载/卸载时会被正确注册与反注册。
* 新增：更新了 `GiveAbilityAndActivateOnce`，使其传入 `FGameplayEventData` 参数。
* 新增：改进了 GameplayAbilities 插件中的 `ScalableFloats`，支持通过新的 Data Registry System 动态查找 curve tables；同时新增了 `ScalableFloat` 头文件，以便在 abilities 插件外更容易复用这个通用结构。
* 新增：新增代码支持，可在其他 Editor 自定义中通过 `GameplayTagsEditorModule` 使用 GameplayTag UI。
* 新增：修改了 `UGameplayAbility` 的 `PreActivate` 方法，使其可选地接收触发事件数据。
* 新增：增强了在 Editor 中按项目自定义过滤条件过滤 GameplayTags 的支持。`OnFilterGameplayTag` 会提供引用该 tag 的属性和 tag source，因此你可以根据哪个资产请求该 tag 来过滤 tags。
* 新增：新增选项，当 `GameplayEffectSpec` 的类方法 `SetContext` 在初始化之后被调用时，可以保留原始捕获的 `SourceTags`。
* 新增：改进了从特定插件注册 GameplayTags 的 UI。新的 tag UI 现在允许你为新增的 GameplayTag source 选择一个插件磁盘位置。
* 新增：Sequencer 新增了一条轨道，可用于在基于 GameplayAbiltiySystem 构建的 Actors 上触发 notify states。和 notifies 一样，`GameplayCueTrack` 可使用基于区间的事件或基于触发的事件。
* 变更：修改了 `GameplayCueInterface`，现在通过引用传递 `GameplayCueParameters` 结构体。
* 优化：对加载和重新生成 GameplayTag 表的性能做了多项改进，从而优化了该选项。


<a name="changelog-4.26"></a>
### 4.26

* GAS 插件不再被标记为 beta。
* 崩溃修复：修复了在没有有效 tag source 选择的情况下添加 gameplay tag 时的崩溃。
* 崩溃修复：向消息中添加了路径字符串参数，以修复 `UGameplayCueManager::VerifyNotifyAssetIsInValidPath` 中的崩溃。
* 崩溃修复：修复了在 `AbilitySystemComponent_Abilities` 中未检查指针就使用时发生的访问冲突崩溃。
* Bug 修复：修复了 stacking GEs 在追加实例时不会重置持续时间的问题。
* Bug 修复：修复了 `CancelAllAbilities` 只会取消 non-instanced abilities 的问题。
* 新增：为 gameplay ability commit 函数新增了可选 tag 参数。
* 新增：为 `PlayMontageAndWait` ability task 新增了 `StartTimeSeconds`，并改进了注释。
* 新增：在 `FGameplayAbilitySpec` 中新增 tag 容器 `DynamicAbilityTags`。这些是可选的 ability tags，会随 spec 一起复制。它们也会被施加的 gameplay effects 捕获为 source tags。
* 新增：GameplayAbility 的 `IsLocallyControlled` 和 `HasAuthority` 函数现在可从 Blueprint 调用。
* 新增：Visual logger 现在只会在当前正在录制 visual logging 数据时，收集和存储 instant GEs 信息。
* 新增：为 Blueprint 节点中的 gameplay attribute pins 增加了 redirectors 支持。
* 新增：新增功能：当 root motion movement 相关的 ability tasks 结束时，它们会把 movement component 的 movement mode 恢复为任务开始前的状态。


<a name="changelog-4.25.1"></a>
### 4.25.1

* 已修复！UE-92787 在 Blueprint 中保存带有 Get Float Attribute 节点且 attribute pin 被内联设置时崩溃
* 已修复！UE-92810 生成 actor 时，如果 instance editable gameplay tag 属性被内联修改，会崩溃

<a name="changelog-4.25"></a>
### 4.25

* 修复了 `RootMotionSource` `AbilityTasks` 的 Prediction。
* [`GAMEPLAYATTRIBUTE_REPNOTIFY()`](#concepts-as-attributes) 现在还额外接收旧的 `Attribute` 值。我们必须把它作为可选参数传给 `OnRep` 函数。此前它会读取 attribute 当前值来尝试获得旧值；但如果它是从 Replication 函数中调用的，那么旧值在到达 `SetBaseAttributeValueFromReplication` 之前就已经被丢弃，因此我们拿到的会是新值。
* 为 `UGameplayAbility` 新增了 [`NetSecurityPolicy`](#concepts-ga-netsecuritypolicy)。
* 崩溃修复：修复了在没有有效 tag source 选择的情况下添加 gameplay tag 时的崩溃。
* 崩溃修复：移除了攻击者可通过 ability system 让服务器崩溃的几种途径。
* 崩溃修复：现在在检查 tag requirements 前会先确保存在 GameplayEffect 定义。
* Bug 修复：修复了 gameplay tag 分类在 Blueprint 中作为函数终止节点一部分时，不会应用到函数参数上的问题。
* Bug 修复：修复了 gameplay effects 的 tags 在多视口下不被复制的问题。
* Bug 修复：修复了 `InternalTryActivateAbility` 在遍历被触发的 abilities 时可能使 gameplay ability spec 失效的问题。
* Bug 修复：更改了我们在 tag count containers 内更新 gameplay tags 的方式。在移除 gameplay tags 时，如果延迟更新父 tags，现在会在父 tags 更新后再调用变化相关的 delegates。这确保 delegates 广播时 tag 表处于一致状态。
* Bug 修复：现在在确认目标时，会先复制一份 spawned target actor 数组再遍历，因为某些回调可能修改该数组。
* Bug 修复：修复了 stacking GameplayEffects 在追加实例时不重置持续时间、并且使用 set by caller durations 时，只有 stack 中第一个实例持续时间正确，其余 GE specs 持续时间都变成 1 秒的问题。并增加了自动化测试以检测此问题。
* Bug 修复：修复了处理 gameplay event delegates 时，如果修改了 gameplay event delegates 列表可能发生的问题。
* Bug 修复：修复了 `GiveAbilityAndActivateOnce` 行为不一致的问题。
* Bug 修复：重新排序了 `FGameplayEffectSpec::Initialize` 内的一些操作，以处理潜在的顺序依赖。
* 新增：`UGameplayAbility` 现在有 `OnRemoveAbility` 函数。它与 `OnGiveAbility` 遵循同样模式，只会在 ability 的主实例或类默认对象上调用。
* 新增：显示 blocked ability tags 时，调试文本现在会包含被阻止 tags 的总数。
* 新增：将 `UAbilitySystemComponent::InternalServerTryActiveAbility` 重命名为 `UAbilitySystemComponent::InternalServerTryActivateAbility`。此前调用 `InternalServerTryActiveAbility` 的代码现在应该改为调用 `InternalServerTryActivateAbility`。
* 新增：当添加或删除 gameplay tag 时，继续保留当前用于显示 gameplay tags 的 filter 文本。此前行为会清空过滤器。
* 新增：在 Editor 中添加新 tag 时，不再重置 tag source。
* 新增：增加了查询 ability system component 上所有带指定 tag 集合的活动 gameplay effects 的能力。新函数名为 `GetActiveEffectsWithAllTags`，可通过代码或 blueprints 使用。
* 新增：当 root motion movement 相关 ability tasks 结束时，它们现在会把 movement component 的 movement mode 恢复为任务开始前的状态。
* 新增：将 `SpawnedAttributes` 标记为 transient，以免保存会变旧且错误的数据；并增加了 null 检查，防止已经保存的旧数据继续传播。这可以避免因坏数据存入 `SpawnedAttributes` 而产生的问题。
* API 变更：`AddDefaultSubobjectSet` 已弃用。应改用 `AddAttributeSetSubobject`。
* 新增：Gameplay Abilities 现在可以指定在哪个 Anim Instance 上播放 montage。


<a name="changelog-4.24"></a>
### 4.24

* 修复了 Blueprint 节点中的 `Attribute` 变量在编译时被重置为 `None` 的问题。
* 现在必须调用 [`UAbilitySystemGlobals::InitGlobalData()`](#concepts-asg-initglobaldata) 才能使用 [`TargetData`](#concepts-targeting-data)，否则会出现 `ScriptStructCache` 错误，并且客户端会从服务器断开。我的建议是现在在每个项目里都始终调用它，因为在 4.24 之前它还是可选的。
* 修复了把一个 `GameplayTag` setter 复制到之前未定义该变量的 blueprint 中时发生的崩溃。
* `UGameplayAbility::MontageStop()` 函数现在会正确使用 `OverrideBlendOutTime` 参数。
* 修复了组件上的 `GameplayTag` 查询变量在编辑时无法被修改的问题。
* 增加了让 `GameplayEffectExecutionCalculations` 支持针对“临时变量”的 scoped modifiers 的能力，这些临时变量不需要由 attribute capture 提供底层支持。
* 其实现本质上允许创建由 `GameplayTag` 标识的 aggregator，作为 execution 暴露一个可被 scoped modifiers 操作的临时值的手段；现在你可以构建那些希望操作某些值、但这些值又不需要从 source 或 target 捕获而来的公式。
* 要使用它，execution 必须把某个 tag 添加到新的成员变量 `ValidTransientAggregatorIdentifiers`；这些 tags 会出现在底部 scoped mods 的 calculation modifier 数组中，并被标记为临时变量，同时细节定制也已更新以支持该功能。
* 增加了 restricted tag 的易用性改进。移除了 restricted `GameplayTag` source 的默认选项。现在在连续添加多个 restricted tags 时，不再重置 source，以让操作更方便。
* `APawn::PossessedBy()` 现在会把 `Pawn` 的 owner 设为新的 `Controller`。这很有用，因为如果 `ASC` 放在 `Pawn` 上，[Mixed Replication Mode](#concepts-asc-rm) 预期 `Pawn` 的 owner 就是 `Controller`。
* 修复了 `FAttributeSetInitterDiscreteLevels` 中 POD（Plain Old Data）相关的 bug。


**[⬆ 返回顶部](#table-of-contents)**
