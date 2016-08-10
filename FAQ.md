# FAQ

## Can I use my existing Terraform definitions and Ansible playbooks?

There's an automatic converter that's not prefect but can save you 99% of the work if you want to convert your existing config files to a Freyfile.

Frey might support running playbook `.yaml` and `.tf` files natively in the future, you could wait for that, too. No promises though.

Beyond the instructions it's just a matter of moving the current state files that you have to Frey recognized places, and you're good to go.

<!-- @todo Link to tusd and uppy-server PRs as examples  -->

## Is Frey reinventing the wheel?

Frey is heavily relying on existing wheels. Frey is a convenience wrapper: a relatively small project, standing on the shoulders of two Giants: [Terraform](https://www.terraform.io/) and [Ansible](https://www.ansible.com/). I found these two make great companions for setting up infrastructure and software, although they weren't necessarily meant to be. What I've learned from marrying the two, I did not want to put into documentation. I wanted to codify it into a project of it's own, so that you could just `npm install --save frey`, and that's that.

## Where do I save my Freyfile, and what do I commit?

We recommend saving the Freyfile in an `infra` directory in your app. Frey will generate some files that like to be in the same directory as this file. Any file named `Frey-residu*` can be git ignored. The rest should be checked in.

Frey automatically commits changes to infra state.

Keeping infra the infra definition of a  project together with the app itself is convenient and allows both to move
at the same pace. If you revert to 2 years ago, you can also inspect the matching infra
from that time.

Of course, this is not right for every project, and you're free to create a dedicated `infra-myapp` Git repository and keep your Freyfile directly in its root.

## How can I locally develop and preview the Frey website?

You should have a working Node.js >=10 and Ruby >=2 install on your workstation. When that is the case, you can run:

```bash
npm run web:preview
```

This will install and start all required services and automatically open a webbrowser that reloads as soon as you make any changes to the source.

The source mainly consists of:

- `./FAQ.md` (FAQ page)
- `./CHANGELOG.md` (changelog page)
- `./website/_layouts/default.html` (the design in which all pages are rendered)
- `./website/index.html` (main CSS file)

The rest is dark magic from which you should probably steer clear. : )

Any changes should be proposed as PRs. Anything added to `master` is automatically deployed using a combination of Travis CI and GitHub Pages.
