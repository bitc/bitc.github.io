/// <reference path="react.d.ts" />
/// <reference path="react-dom.d.ts" />

// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Absolutely minimally stripped Lens class from monocle-ts
// --------------------------------------------------------------------
// --------------------------------------------------------------------

function lensFromProp<S, P extends keyof S>(prop: P): Lens<S, S[P]> {
    return new Lens(s => s[prop], a => s => Object.assign({}, s, { [prop as any]: a }))
}

/*
  Laws:
  1. get(set(a)(s)) = a
  2. set(get(s))(s) = s
  3. set(a)(set(a)(s)) = set(a)(s)
*/
class Lens<S, A> {
    readonly _tag: 'Lens' = 'Lens'
    constructor(readonly get: (s: S) => A, readonly set: (a: A) => (s: S) => S) { }

    static fromProp<S>(): <P extends keyof S>(prop: P) => Lens<S, S[P]>
    static fromProp<S, P extends keyof S>(prop: P): Lens<S, S[P]>
    static fromProp(): any {
        return arguments.length === 0 ? lensFromProp : lensFromProp<any, any>(arguments[0])
    }

    /** generate a lens from a type and an array of props */
    static fromProps<S>(): <P extends keyof S>(props: Array<P>) => Lens<S, { [K in P]: S[K] }> {
        return props => {
            const len = props.length
            return new Lens(
                s => {
                    const r: any = {}
                    for (let i = 0; i < len; i++) {
                        const k = props[i]
                        r[k] = s[k]
                    }
                    return r
                },
                a => s => Object.assign({}, s, a)
            )
        }
    }

    modify(f: (a: A) => A): (s: S) => S {
        return s => this.set(f(this.get(s)))(s)
    }

    /** compose a Lens with a Lens */
    compose<B>(ab: Lens<A, B>): Lens<S, B> {
        return new Lens(s => ab.get(this.get(s)), b => s => this.set(ab.set(b)(this.get(s)))(s))
    }

    /** @alias of `compose` */
    composeLens<B>(ab: Lens<A, B>): Lens<S, B> {
        return this.compose(ab)
    }
}

// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Form1
// --------------------------------------------------------------------
// --------------------------------------------------------------------

interface Form1Props {
    onSubmit: (firstName: string, lastName: string) => void;
}

interface Form1State {
    firstName: string;
    lastName: string;
}

class Form1 extends React.Component<Form1Props, Form1State> {
    constructor(props: Form1Props) {
        super(props);

        this.state = {
            firstName: "",
            lastName: ""
        };
    }

    handleFirstNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            firstName: e.target.value
        });
    }

    handleLastNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            lastName: e.target.value
        });
    }

    handleSubmitClick = (e: React.MouseEvent) => {
        e.preventDefault();
        this.props.onSubmit(this.state.firstName, this.state.lastName);
    }

    render() {
        return (
            <form>
                <label>
                    First Name:
                    <input
                        type="text"
                        value={this.state.firstName}
                        onChange={this.handleFirstNameChange}
                    />
                    ({this.state.firstName.length} chars)
                </label>
                <label>
                    Last Name:
                    <input
                        type="text"
                        value={this.state.lastName}
                        onChange={this.handleLastNameChange}
                    />
                    ({this.state.lastName.length} chars)
                </label>
                <input
                    type="submit"
                    disabled={this.state.firstName === "" || this.state.lastName === ""}
                    onClick={this.handleSubmitClick}
                />
                <pre>
                    {JSON.stringify(this.state, null, 2)}
                </pre>
            </form>
        );
    }
}

// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Form2
// --------------------------------------------------------------------
// --------------------------------------------------------------------

interface Form2Props {
    onSubmit: (firstName: string, lastName: string) => void;
}

interface Form2State {
    firstName: string;
    lastName: string;
}

class Form2 extends React.Component<Form2Props, Form2State> {
    constructor(props: Form2Props) {
        super(props);

        this.state = {
            firstName: "",
            lastName: ""
        };
    }

    handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        this.setState({
            [e.target.name]: e.target.value
        } as any);
    }

    handleSubmitClick = (e: React.MouseEvent) => {
        e.preventDefault();
        this.props.onSubmit(this.state.firstName, this.state.lastName);
    }

    render() {
        return (
            <form>
                <label>
                    First Name:
                    <input
                        name="firstName"
                        type="text"
                        value={this.state.firstName}
                        onChange={this.handleInputChange}
                    />
                    ({this.state.firstName.length} chars)
                </label>
                <label>
                    Last Name:
                    <input
                        name="lastName"
                        type="text"
                        value={this.state.lastName}
                        onChange={this.handleInputChange}
                    />
                    ({this.state.lastName.length} chars)
                </label>
                <input
                    type="submit"
                    disabled={this.state.firstName === "" || this.state.lastName === ""}
                    onClick={this.handleSubmitClick}
                />
                <pre>
                    {JSON.stringify(this.state, null, 2)}
                </pre>
            </form>
        );
    }
}

// --------------------------------------------------------------------
// --------------------------------------------------------------------
// LensyTextInput
// --------------------------------------------------------------------
// --------------------------------------------------------------------


interface LensyTextInputProps<S> {
    component: React.Component<unknown, S>;
    lens: Lens<S, string>;
}

function LensyTextInput<S>(props: LensyTextInputProps<S>): JSX.Element {
    return (
        <>
            <input
                type="text"
                value={props.lens.get(props.component.state)}
                onChange={e => props.component.setState(props.lens.set(e.target.value))}
            />
            ({props.lens.get(props.component.state).length} chars)
        </>
    );
}

// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Form3
// --------------------------------------------------------------------
// --------------------------------------------------------------------

interface Form3Props {
    onSubmit: (firstName: string, lastName: string) => void;
}

interface Form3State {
    firstName: string;
    lastName: string;
}

const firstNameLens = Lens.fromProp<Form3State>()("firstName");
const lastNameLens = Lens.fromProp<Form3State>()("lastName");

class Form3 extends React.Component<Form3Props, Form3State> {
    constructor(props: Form3Props) {
        super(props);

        this.state = {
            firstName: "",
            lastName: ""
        };
    }

    handleSubmitClick = (e: React.MouseEvent) => {
        e.preventDefault();
        this.props.onSubmit(this.state.firstName, this.state.lastName);
    }

    render() {
        return (
            <form>
                <label>
                    First Name:
                    <LensyTextInput component={this} lens={firstNameLens} />
                </label>
                <label>
                    Last Name:
                    <LensyTextInput component={this} lens={lastNameLens} />
                </label>
                <input
                    type="submit"
                    disabled={this.state.firstName === "" || this.state.lastName === ""}
                    onClick={this.handleSubmitClick}
                />
                <pre>
                    {JSON.stringify(this.state, null, 2)}
                </pre>
            </form>
        );
    }
}

// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Form4
// --------------------------------------------------------------------
// --------------------------------------------------------------------

interface Form4Props {
    onSubmit: (firstName: string, lastName: string) => void;
}

interface Person {
    firstName: string;
    lastName: string;
}

interface Form4State {
    person: Person;
}

const personFirstNameLens = Lens.fromProp<Person>()("firstName");
const personLastNameLens = Lens.fromProp<Person>()("lastName");

const personLens = Lens.fromProp<Form4State>()("person");

class Form4 extends React.Component<Form4Props, Form4State> {
    constructor(props: Form4Props) {
        super(props);

        this.state = {
            person: {
                firstName: "",
                lastName: ""
            }
        };
    }

    handleSubmitClick = (e: React.MouseEvent) => {
        e.preventDefault();
        this.props.onSubmit(this.state.person.firstName, this.state.person.lastName);
    }

    render() {
        return (
            <form>
                <label>
                    First Name:
                    <LensyTextInput
                        component={this}
                        lens={personLens.compose(personFirstNameLens)}
                    />
                </label>
                <label>
                    Last Name:
                    <LensyTextInput
                        component={this}
                        lens={personLens.compose(personLastNameLens)}
                    />
                </label>
                <input
                    type="submit"
                    disabled={this.state.person.firstName === "" || this.state.person.lastName === ""}
                    onClick={this.handleSubmitClick}
                />
                <pre>
                    {JSON.stringify(this.state, null, 2)}
                </pre>
            </form>
        );
    }
}

// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Form5
// --------------------------------------------------------------------
// --------------------------------------------------------------------

const firstNamePartLens: Lens<string, string> = new Lens<string, string>(
    // Getter:
    (fullName: string): string => {
        const spaceIndex = fullName.lastIndexOf(" ");
        if (spaceIndex >= 0) {
            return fullName.substr(0, spaceIndex);
        } else {
            return "";
        }
    },
    // Setter:
    (firstName: string) => (fullName: string): string => {
        const spaceIndex = fullName.lastIndexOf(" ");
        if (spaceIndex >= 0) {
            return firstName + fullName.substr(spaceIndex);
        } else {
            return firstName + " " + fullName;
        }
    }
);

const lastNamePartLens: Lens<string, string> = new Lens<string, string>(
    // Getter:
    (fullName: string) => {
        const spaceIndex = fullName.lastIndexOf(" ");
        if (spaceIndex >= 0) {
            return fullName.substr(spaceIndex + 1);
        } else {
            return "";
        }
    },
    // Setter:
    (lastName: string) => (fullName: string): string => {
        const spaceIndex = fullName.lastIndexOf(" ");
        if (spaceIndex >= 0) {
            return fullName.substr(0, spaceIndex) + " " + lastName.trim();
        } else {
            return lastName.trim();
        }
    }
);

interface Form5Props {
    onSubmit: (firstName: string, lastName: string) => void;
}

interface Form5State {
    fullName: string;
}

const fullNameLens = Lens.fromProp<Form5State>()("fullName");

class Form5 extends React.Component<Form5Props, Form5State> {
    constructor(props: Form5Props) {
        super(props);

        this.state = {
            fullName: ""
        };
    }

    handleSubmitClick = (e: React.MouseEvent) => {
        e.preventDefault();
        this.props.onSubmit(
            fullNameLens.compose(firstNamePartLens).get(this.state),
            fullNameLens.compose(lastNamePartLens).get(this.state));
    }

    render() {
        return (
            <form>
                <label>
                    First Name:
                    <LensyTextInput
                        component={this}
                        lens={fullNameLens.compose(firstNamePartLens)}
                    />
                </label>
                <label>
                    Last Name:
                    <LensyTextInput
                        component={this}
                        lens={fullNameLens.compose(lastNamePartLens)}
                    />
                </label>
                <input
                    type="submit"
                    disabled={
                        fullNameLens.compose(firstNamePartLens).get(this.state) === "" ||
                        fullNameLens.compose(lastNamePartLens).get(this.state) === ""}
                    onClick={this.handleSubmitClick}
                />
                <pre>
                    {JSON.stringify(this.state, null, 2)}
                </pre>
            </form>
        );
    }
}

// --------------------------------------------------------------------
// --------------------------------------------------------------------
// Form6
// --------------------------------------------------------------------
// --------------------------------------------------------------------

interface Form6Props {
    onSubmit: (firstName: string, lastName: string) => void;
}

interface Organization {
    name: string;
    ceo: Person;
    janitor: Person;
}

interface Form6State {
    specialName: string;
    organization: Organization;
}

const organizationNameLens = Lens.fromProp<Organization>()("name");
const organizationCeoLens = Lens.fromProp<Organization>()("ceo");
const organizationJanitorLens = Lens.fromProp<Organization>()("janitor");

const organizationLens = Lens.fromProp<Form6State>()("organization");
const specialNameLens = Lens.fromProp<Form6State>()("specialName");

class Form6 extends React.Component<Form6Props, Form6State> {
    constructor(props: Form6Props) {
        super(props);

        this.state = {
            specialName: "Donut",
            organization: {
                name: "",
                ceo: {
                    firstName: "",
                    lastName: "Tribble"
                },
                janitor: {
                    firstName: "Jimmy",
                    lastName: "Donut"
                }
            }
        };
    }

    handleSubmitClick = (e: React.MouseEvent) => {
        e.preventDefault();
        this.props.onSubmit(this.state.organization.ceo.firstName, this.state.organization.ceo.lastName);
    }

    render() {
        return (
            <form>
                <label>
                    Organization:
                    <LensyTextInput
                        component={this}
                        lens={organizationLens.compose(organizationNameLens)}
                    />
                </label>
                <label>
                    Choose a Special Name:
                    <LensyTextInput
                        component={this}
                        lens={specialNameLens}
                    />
                </label>
                <label>
                    CEO Last Name:
                    <LensyTextInput
                        component={this}
                        lens={organizationLens.compose(organizationCeoLens).compose(personLastNameLens)}
                    />
                </label>
                {(this.state.organization.ceo.lastName === this.state.specialName)
                    ? <div><em>The CEO has a special name!</em></div>
                    : null}
                <label>
                    Janitor First Name:
                    <LensyTextInput
                        component={this}
                        lens={organizationLens.compose(organizationJanitorLens).compose(personFirstNameLens)}
                    />
                </label>
                <label>
                    Janitor Last Name:
                    <LensyTextInput
                        component={this}
                        lens={organizationLens.compose(organizationJanitorLens).compose(personLastNameLens)}
                    />
                </label>
                {(this.state.organization.janitor.lastName === this.state.specialName)
                    ? <div><em>The Janitor has a special name!</em></div>
                    : null}
                <pre>
                    {JSON.stringify(this.state, null, 2)}
                </pre>
            </form>
        );
    }
}

// --------------------------------------------------------------------

for (let i = 1; i <= 6; ++i) {
    const formElem = document.getElementById(`form${i}`);
    ReactDOM.render(
        React.createElement(
            window[`Form${i}`],
            {
                onSubmit: (firstName: string, lastName: string) => alert(`Hello ${firstName} ${lastName}`)
            }),
        formElem);
}
