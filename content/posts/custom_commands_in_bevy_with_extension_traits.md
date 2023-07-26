---
title: Custom commands in Bevy with extension traits
date: 2021-02-25
categories:
  - tutorial
tags:
  - rust
  - bevy
  - gamedev
---

[Bevy](https://bevyengine.org) is an ECS-based game engine built in Rust.
[Extension traits](https://rust-lang.github.io/rfcs/0445-extension-trait-conventions.html)
are a pattern in rust that allows you to add methods to an existing type
defined outside of your crate. You can probably guess where I'm going with
this.

In bevy, any system can access the
[`Commands`](https://docs.rs/bevy/0.4.0/bevy/ecs/struct.Commands.html)
structure to issue commands manipulate the
[`World`](https://docs.rs/bevy/0.4.0/bevy/ecs/struct.World.html). The most
common one would probably be the
[`Commands#spawn`](https://docs.rs/bevy/0.4.0/bevy/ecs/struct.Commands.html#method.spawn)
method which lets you spawn an entity with the components you specify. You can
pass a structure implementing the
[Bundle](https://docs.rs/bevy/0.4.0/bevy/ecs/trait.Bundle.html) trait to this
method. Luckily, tuples of none to many components implement this trait thanks
to [macro magic](https://github.com/bevyengine/bevy/blob/v0.4.0/crates/bevy_ecs/src/core/bundle.rs#L87),
so you can just call the method like:

```rust
commands.spawn((Component1 {x: 3.0, y: 4.0}, Component2 {value: true}))
```

Or, you can easily define your own bundles and use them:

```rust
use bevy::ecs::*;

#[derive(Bundle)]
struct HumbleBundle {
    component1: Component1,
    component2: Component2,
}

// ... lines later, somewhere in a system
commands.spawn(HumbleBundle {
    component1: Component1 {x: 3.0, y: 4.0},
    component2: Component2 {value: true}
});
```

But maybe you need to spawn multiple entities that refer to eachother or
something. Then, you need to implement a new
[`Command`](https://docs.rs/bevy/0.4.0/bevy/ecs/trait.Command.html) yourself.

```rust
use bevy::ecs::*;

struct ReferringComponent {
    refers_to: Entity
}

struct ComponentFoo {
    bar: i32
}

struct SpawnReferringPair {
    first_bar: i32,
    second_bar: i32,
}

// create two entities, the second one referring to the first one
impl Command for SpawnReferringPair {
    fn write(self: Box<Self>, world: &mut World, resources: &mut Resources) {
        let first_entity = world.spawn((ComponentFoo {bar: self.first_bar}, ));
        world.spawn((ComponentFoo {bar: self.second_bar}, ReferringComponent {refers_to: first_entity}));
    }
}
```

And we can use this `Command` with `Commands`, like:

```rust
commands.add_command(SpawnReferringPair {first_bar: 5, second_bar: 10});
```

Now, this is completely fine and functional. But I think we can make it prettier, so we can use it like:

```rust
commands.spawn_referring_pair(5, 10);
```

<img style="width: 50%; min-width: 440px; height: 100%;" src="https://i.imgur.com/jKuwJ2T.png"></img>

We just have to add a method to Bevy's already defined `Commands` structure with an extension trait.

```rust
// imagine that the code defining SpawnReferringPair is here as well :)

trait CommandsExt {
    fn spawn_referring_pair(&mut self, first_bar: i32, second_bar: i32) -> &mut Self;
}

impl CommandsExt for Commands {
    fn spawn_referring_pair(&mut self, first_bar: i32, second_bar: i32) -> &mut Self {
        self.add_command(SpawnReferringPair {
            first_bar, second_bar // field init shorthand
        });
        self
    }
}
```

And voila, we can use this method just like the `spawn` method:

```
commands
    .spawn_referring_pair(5, 10)
    .spawn((SomeOtherComponent,))
    .spawn_referring_pair(1024, 1);
```

In conclusion, don't let the computer tell you what to do, make it do what you
want, however arbitrary it might be. Also, Bevy is pre-1.0 and as much as they
try to keep things backwards-compatible, this article might not be correct
beyond `0.4`, or it could be, check the source code, nerd.
