import React, { Component } from "react";

import Image from "../../../components/Image/Image";
import "./SinglePost.css";

const GRAPHQL_URL = "http://localhost:8080/graphql";

class SinglePost extends Component {
  state = {
    title: "",
    author: "",
    date: "",
    image: "",
    content: "",
  };

  componentDidMount() {
    const postId = this.props.match.params.postId;
    const graphqlQuery = {
      query: `
      query FetchSingle($postId: ID!) {
        post(id: $postId) {
          title
          content
          imageUrl
          creator {
            name
          }
          createdAt
        }
      }
      `,
      variables: {
        postId: postId,
      },
    };
    fetch(GRAPHQL_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${this.props.token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(graphqlQuery),
    })
      .then((res) => {
        return res.json();
      })
      .then((resData) => {
        if (resData.errors) {
          throw new Error("Fetching post failed");
        }
        const {
          title,
          creator,
          imageUrl,
          content,
          createdAt,
        } = resData.data.post;

        this.setState({
          title: title,
          author: creator.name,
          image: `http://localhost:8080/${imageUrl}`,
          date: new Date(createdAt).toLocaleDateString("en-US"),
          content: content,
        });
      })
      .catch((err) => {
        console.log(err);
      });
  }

  render() {
    return (
      <section className="single-post">
        <h1>{this.state.title}</h1>
        <h2>
          Created by {this.state.author} on {this.state.date}
        </h2>
        <div className="single-post__image">
          <Image contain imageUrl={this.state.image} />
        </div>
        <p>{this.state.content}</p>
      </section>
    );
  }
}

export default SinglePost;
