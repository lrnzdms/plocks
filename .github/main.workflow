workflow "New workflow" {
  on = "push"
  resolves = ["GitHub Action for npm"]
}

workflow "New workflow 1" {
  on = "push"
}

action "GitHub Action for npm" {
  uses = "actions/npm@4633da3702a5366129dca9d8cc3191476fc3433c"
  args = "install"
}
