// Cadastro do usuario

document.addEventListener("DOMContentLoaded", () => {
  const cadastrarBtn = document.getElementsByClassName("btn-cadastro")[0];

  cadastrarBtn.addEventListener("click", async () => {
    const login = document.getElementById("usuario").value.trim();
    const email = document.getElementById("email").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!login || !email || !senha) {
      alert("Preencha todos os campos");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/users");
      const users = await res.json();

      const existente = users.some(u => u.login === login || u.email === email);
      if (existente) {
        alert("Este login ou e-mail já está sendo utilizado");
        return;
      }

      const maiorId = users.reduce((max, user) => Math.max(max, user.id), 0);

      const novoUsuario = {
        id: maiorId + 1,
        login,
        senha,
        email,
        logado: false 
      };

      await fetch("http://localhost:3000/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(novoUsuario)
      });

      alert("Usuário cadastrado com sucesso!");
      location.reload(); 
    } catch (error) {
      console.error("Erro cadastro", error);
      alert("Erro ao cadastrar usuário");
    }
  });
});

// Login do usuario

document.addEventListener("DOMContentLoaded", () => {
  const login = document.getElementsByClassName("btn-logar")[0];

  login.addEventListener("click", async () => {
    const login = document.getElementById("usuario").value.trim();
    const senha = document.getElementById("senha").value.trim();

    if (!login || !senha) {
      alert("Preencha todos os campos!");
      return;
    }

    try {
      const res = await fetch("http://localhost:3000/users");
      const users = await res.json();

      const user = users.find(u => u.login === login && u.senha === senha);

      if (!user) {
        alert("Usuário ou senha inválidos.");
        return;
      }

      // Atualiza o campo logado para true
      await fetch(`http://localhost:3000/users/${user.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ logado: true })
      });

      window.location.href = `index.html?usuario=${user.id}`; 

    } catch (error) {
      console.error("Erro login", error);
      alert("Erro ao logar");
    }
  });
});
