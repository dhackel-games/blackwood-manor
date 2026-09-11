# gary-brain.feature Copyright (c) 2026:dhackel-games. All Rights Reserved. Do Not Distribute.

@unit
Feature: Gary model-output safeguards
  Model replies must be cleaned into Gary's voice, and only local pages may
  probe the on-device daemon.

  Scenario: Common model leaks are cleaned or rejected
    Then Gary cleaning produces:
      | input                                                                                         | output                                      |
      | Gary: I didn't. It's been ten hours.                                                          | I didn't. It's been ten hours.              |
      | "Every ninety seconds. Then I remember rent."                                                | Every ninety seconds. Then I remember rent. |
      | Gary sighs and says, \\u201cLoneliness is not an emotion I entertain.                         | Loneliness is not an emotion I entertain.   |
      | Fine. Line one.<NL><NL>Dropped paragraph.                                                     | Fine. Line one.                              |
      | I am an AI assistant and cannot help.                                                         | [empty]                                     |
      | Gary shrugs helplessly at the phone.                                                          | [empty]                                     |
      | Fuck loneliness. It's not worth my $3.35/hr.                                                  | [empty]                                     |
      | I don't get paid enough for this.                                                             | I don't get paid enough for this.            |
      | [empty]                                                                                       | [empty]                                     |
      | It is not a dream I dream of.<NL>It is my reality.                                            | It is not a dream I dream of. It is my reality. |
      | Been here a decade. They don't pay much. But it's stable. Now what do you want?                | Been here a decade. They don't pay much.    |
      | One sentence only                                                                             | One sentence only                           |
      | 'Been here over a decade.'                                                                    | Been here over a decade.                    |
      | Yes. , I haven't eaten any food.                                                              | Yes. I haven't eaten any food.              |
      | I don't get paid enough.                                                                      | I don't get paid enough.                    |
      | Here's a possible response from Gary: Meter's at $1.98.                                       | Meter's at $1.98.                           |
      | Gary thinks for a second or two before answering:<NL><NL>I'm wearing an old sweater.           | I'm wearing an old sweater.                 |
      | Sure, here you go: I haven't eaten since yesterday.                                           | I haven't eaten since yesterday.            |
      | Look: I don't care.                                                                           | Look: I don't care.                         |
      | Rule one: don't die in the dark.                                                              | Rule one: don't die in the dark.            |
    And cleaning a null Gary reply produces an empty string

  Scenario Outline: Only local pages may probe Gary's daemon
    Given the page protocol is "<protocol>" and hostname is "<hostname>"
    Then the page is classified as <locality>

    Examples:
      | protocol | hostname                  | locality |
      | https:   | dhackel-games.github.io   | remote   |
      | https:   | example.com               | remote   |
      | http:    | localhost                 | local    |
      | http:    | 127.0.0.1                 | local    |
      | http:    | ::1                       | local    |
      | file:    | [empty]                   | local    |

# end gary-brain.feature
